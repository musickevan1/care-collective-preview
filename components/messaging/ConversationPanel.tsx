'use client'

import { ReactElement } from 'react'
import { useMessagingContext } from './MessagingContext'
import { ConversationList } from './ConversationList'
import { PendingOffersSection } from './PendingOffersSection'
import { Button } from '@/components/ui/button'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationPanelProps {
  isMobile: boolean
  showConversationList: boolean
  className?: string
}

/**
 * ConversationPanel - Left sidebar containing conversation list and pending offers
 *
 * Features:
 * - Tab navigation between active and pending conversations
 * - Unread count display
 * - Refresh button for pending offers
 * - Mobile-responsive visibility
 *
 * @component
 */
export function ConversationPanel({
  isMobile,
  showConversationList,
  className
}: ConversationPanelProps): ReactElement {
  const {
    conversations,
    selectedConversation,
    activeTab,
    setActiveTab,
    pendingOffers,
    isLoadingOffers,
    loadPendingOffers,
    handleConversationSelect,
    handleAcceptOffer,
    handleRejectOffer,
    userId
  } = useMessagingContext()

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border bg-muted/20",
        isMobile
          ? (showConversationList ? "w-full" : "hidden")
          : "w-80 min-w-80",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sage" />
            Messages
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPendingOffers}
            disabled={isLoadingOffers}
            aria-label="Refresh conversations"
          >
            <RefreshCw className={cn("w-4 h-4", isLoadingOffers && "animate-spin")} />
          </Button>
        </div>
        {conversations.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {conversations.reduce((total, conv) => total + conv.unread_count, 0)} unread messages
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <nav className="flex gap-2 border-b border-border px-4" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-4 py-3 font-medium transition-colors relative text-sm",
            activeTab === 'active'
              ? "text-sage border-b-2 border-sage"
              : "text-muted-foreground hover:text-secondary"
          )}
        >
          Active ({conversations.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-4 py-3 font-medium transition-colors relative text-sm",
            activeTab === 'pending'
              ? "text-sage border-b-2 border-sage"
              : "text-muted-foreground hover:text-secondary"
          )}
        >
          Pending ({pendingOffers.length})
        </button>
      </nav>

      {/* Conditional Content */}
      {activeTab === 'active' && (
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation || undefined}
          onConversationSelect={handleConversationSelect}
          className="flex-1"
        />
      )}
      {activeTab === 'pending' && (
        <div className="flex-1 overflow-auto p-4">
          <PendingOffersSection
            offers={pendingOffers}
            currentUserId={userId}
            onAccept={handleAcceptOffer}
            onReject={handleRejectOffer}
            isLoading={isLoadingOffers}
          />
        </div>
      )}
    </div>
  )
}
