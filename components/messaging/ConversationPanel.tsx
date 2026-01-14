'use client'

import { ReactElement } from 'react'
import { useMessagingContext } from './MessagingContext'
import { ConversationList } from './ConversationList'
import { PendingOffersSection } from './PendingOffersSection'
import { WelcomeBanner } from './WelcomeBanner'
import { HelpTooltip } from './HelpTooltip'
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
        "flex flex-col border-r border-border bg-muted/40",
        isMobile
          ? (showConversationList ? "w-full" : "hidden")
          : "w-80 min-w-80",
        className
      )}
      data-tour="conversation-list"
    >
      {/* Header - Hidden on mobile since PlatformLayout shows "Community Messages" */}
      <div className="hidden md:block p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-sage" />
              Messages
            </h2>
            <div data-tour="help-tooltip">
              <HelpTooltip
                content="Your active conversations appear below. Click on any conversation to view and send messages."
                side="right"
                ariaLabel="Help: About conversations"
              />
            </div>
          </div>
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

      {/* Tab Navigation - Refresh button added for mobile */}
      <nav className="flex items-center border-b border-border px-4" role="tablist">
        <button
          id="active-tab"
          role="tab"
          aria-selected={activeTab === 'active'}
          aria-controls="active-tabpanel"
          tabIndex={activeTab === 'active' ? 0 : -1}
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
          id="pending-tab"
          role="tab"
          aria-selected={activeTab === 'pending'}
          aria-controls="pending-tabpanel"
          tabIndex={activeTab === 'pending' ? 0 : -1}
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
        {/* Mobile-only refresh button */}
        <div className="md:hidden ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPendingOffers}
            disabled={isLoadingOffers}
            aria-label="Refresh conversations"
            className="h-10 w-10 p-0"
          >
            <RefreshCw className={cn("w-4 h-4", isLoadingOffers && "animate-spin")} />
          </Button>
        </div>
      </nav>

      {/* Conditional Content */}
      {activeTab === 'active' && (
        <div id="active-tabpanel" role="tabpanel" aria-labelledby="active-tab" className="flex-1 flex flex-col overflow-hidden">
          {/* Welcome Banner for new users - compact variant */}
          <WelcomeBanner variant="compact" />
          
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation || undefined}
            onConversationSelect={handleConversationSelect}
            className="flex-1"
          />
        </div>
      )}
      {activeTab === 'pending' && (
        <div id="pending-tabpanel" role="tabpanel" aria-labelledby="pending-tab" className="flex-1 overflow-auto p-4">
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
