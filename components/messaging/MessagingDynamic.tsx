'use client'

import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/ui/loading'
import type { ConversationWithDetails, MessageWithSender } from '@/lib/messaging/types'

// Dynamically import messaging components to reduce bundle size
const MessagingDashboard = lazy(() => import('./MessagingDashboard').then(m => ({ default: m.MessagingDashboard })))
const VirtualizedMessageList = lazy(() => import('./VirtualizedMessageList').then(m => ({ default: m.VirtualizedMessageList })))
const ConversationList = lazy(() => import('./ConversationList').then(m => ({ default: m.ConversationList })))
const MessageInput = lazy(() => import('./MessageInput').then(m => ({ default: m.MessageInput })))
const MessageBubble = lazy(() => import('./MessageBubble').then(m => ({ default: m.MessageBubble })))

type MessagingComponentProps =
  | { component: 'dashboard'; initialConversations: ConversationWithDetails[]; userId: string; userName?: string; selectedConversationId?: string; enableRealtime?: boolean }
  | { component: 'message-list'; messages: MessageWithSender[]; currentUserId: string; isLoading?: boolean; hasMore?: boolean; onLoadMore?: () => void }
  | { component: 'conversation-list'; conversations: ConversationWithDetails[]; selectedConversationId?: string; onConversationSelect: (conversationId: string) => void; loading?: boolean; error?: string | null }
  | { component: 'message-input'; onSendMessage: (content: string, messageType?: 'text' | 'help_request_update') => Promise<void>; placeholder?: string; disabled?: boolean; maxLength?: number; minHeight?: string }
  | { component: 'message-bubble'; message: MessageWithSender; isCurrentUser: boolean; onReply?: () => void; onReport?: (messageId: string) => void; onDelete?: (messageId: string) => void }

export function MessagingDynamic(props: MessagingComponentProps) {
  const renderComponent = () => {
    switch (props.component) {
      case 'dashboard':
        return <MessagingDashboard initialConversations={props.initialConversations} userId={props.userId} userName={props.userName} selectedConversationId={props.selectedConversationId} enableRealtime={props.enableRealtime} />
      case 'message-list':
        return <VirtualizedMessageList messages={props.messages} currentUserId={props.currentUserId} isLoading={props.isLoading} hasMore={props.hasMore} onLoadMore={props.onLoadMore} />
      case 'conversation-list':
        return <ConversationList conversations={props.conversations} selectedConversationId={props.selectedConversationId} onConversationSelect={props.onConversationSelect} loading={props.loading} error={props.error} />
      case 'message-input':
        return <MessageInput onSendMessage={props.onSendMessage} placeholder={props.placeholder} disabled={props.disabled} maxLength={props.maxLength} minHeight={props.minHeight} />
      case 'message-bubble':
        return <MessageBubble message={props.message} isCurrentUser={props.isCurrentUser} onReply={props.onReply} onReport={props.onReport} onDelete={props.onDelete} />
      default:
        return <div>Unknown messaging component</div>
    }
  }

  return (
    <Suspense fallback={
      <LoadingSkeleton
        type="card"
        lines={4}
        className="space-y-3"
      />
    }>
      {renderComponent()}
    </Suspense>
  )
}

// Export individual lazy components for direct use
export const LazyMessagingDashboard = lazy(() => import('./MessagingDashboard').then(m => ({ default: m.MessagingDashboard })))
export const LazyVirtualizedMessageList = lazy(() => import('./VirtualizedMessageList').then(m => ({ default: m.VirtualizedMessageList })))
export const LazyConversationList = lazy(() => import('./ConversationList').then(m => ({ default: m.ConversationList })))
export const LazyMessageInput = lazy(() => import('./MessageInput').then(m => ({ default: m.MessageInput })))
export const LazyMessageBubble = lazy(() => import('./MessageBubble').then(m => ({ default: m.MessageBubble })))