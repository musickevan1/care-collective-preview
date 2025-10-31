'use client'

import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Dynamically import messaging components to reduce bundle size
const MessagingDashboard = lazy(() => import('./MessagingDashboard').then(m => ({ default: m.MessagingDashboard })))
const VirtualizedMessageList = lazy(() => import('./VirtualizedMessageList').then(m => ({ default: m.VirtualizedMessageList })))
const ConversationList = lazy(() => import('./ConversationList').then(m => ({ default: m.ConversationList })))
const MessageInput = lazy(() => import('./MessageInput').then(m => ({ default: m.MessageInput })))
const MessageBubble = lazy(() => import('./MessageBubble').then(m => ({ default: m.MessageBubble })))

interface MessagingComponentProps {
  component: 'dashboard' | 'message-list' | 'conversation-list' | 'message-input' | 'message-bubble'
  [key: string]: any
}

export function MessagingDynamic({ component, ...props }: MessagingComponentProps) {
  const renderComponent = () => {
    switch (component) {
      case 'dashboard':
        return <MessagingDashboard {...props} />
      case 'message-list':
        return <VirtualizedMessageList {...props} />
      case 'conversation-list':
        return <ConversationList {...props} />
      case 'message-input':
        return <MessageInput {...props} />
      case 'message-bubble':
        return <MessageBubble {...props} />
      default:
        return <div>Unknown messaging component</div>
    }
  }

  return (
    <Suspense fallback={
      <LoadingSkeleton
        lines={4}
        className="space-y-3"
        aria-label="Loading messaging component"
      />
    }>
      {renderComponent()}
    </Suspense>
  )
}

// Export individual lazy components for direct use
export const LazyMessagingDashboard = lazy(() => import('./MessagingDashboard'))
export const LazyVirtualizedMessageList = lazy(() => import('./VirtualizedMessageList'))
export const LazyConversationList = lazy(() => import('./ConversationList'))
export const LazyMessageInput = lazy(() => import('./MessageInput'))
export const LazyMessageBubble = lazy(() => import('./MessageBubble'))