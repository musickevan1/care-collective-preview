'use client'

import { ReactElement, useRef } from 'react'
import { MessageWithSender } from '@/lib/messaging/types'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface MessageThreadViewProps {
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  userId: string
  onRetry?: () => void
  className?: string
}

/**
 * MessageThreadView - Displays messages with loading and error states
 *
 * Features:
 * - Message list with auto-scroll anchor
 * - Loading state with spinner
 * - Error state with retry button
 * - Scrollable container
 *
 * Note: This component currently uses ScrollArea.
 * In Phase 2, it will be upgraded to use VirtualizedMessageList for better performance.
 *
 * @component
 */
export function MessageThreadView({
  messages,
  loading,
  error,
  userId,
  onRetry,
  className
}: MessageThreadViewProps): ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Loading state
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className || ''}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading messages...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center p-4 ${className || ''}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Messages display
  return (
    <ScrollArea className={`flex-1 p-4 ${className || ''}`}>
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === userId}
            showSenderName={true}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
