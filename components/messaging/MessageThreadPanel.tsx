'use client'

import { ReactElement, forwardRef } from 'react'
import { useMessagingContext } from './MessagingContext'
import { ConversationHeader } from './ConversationHeader'
import { MessageThreadView } from './MessageThreadView'
import { TypingIndicator } from './TypingIndicator'
import { MessageInput } from './MessageInput'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageThreadPanelProps {
  isMobile: boolean
  showConversationList: boolean
  messageThreadRef: React.RefObject<HTMLDivElement>
  userName?: string
  onBack?: () => void
  className?: string
}

/**
 * MessageThreadPanel - Right pane containing the active conversation
 *
 * Features:
 * - Empty state when no conversation selected
 * - Conversation header with participant info
 * - Message thread display
 * - Typing indicator
 * - Message input area
 *
 * @component
 */
export const MessageThreadPanel = forwardRef<HTMLDivElement, MessageThreadPanelProps>(
  function MessageThreadPanel(
    {
      isMobile,
      showConversationList,
      messageThreadRef,
      userName,
      onBack,
      className
    },
    ref
  ): ReactElement {
    const {
      selectedConversation,
      messageThread,
      loadMessages,
      handleSendMessage,
      userId
    } = useMessagingContext()

    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 flex flex-col",
          isMobile && showConversationList && "hidden",
          className
        )}
      >
        {!selectedConversation ? (
          // Empty state - no conversation selected
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            {messageThread.conversation && (
              <ConversationHeader
                conversation={messageThread.conversation}
                userId={userId}
                isMobile={isMobile}
                onBack={onBack}
              />
            )}

            {/* Messages Area */}
            <div ref={messageThreadRef} className="flex-1 flex flex-col min-h-0">
              <MessageThreadView
                messages={messageThread.messages}
                loading={messageThread.loading}
                error={messageThread.error}
                userId={userId}
                onRetry={() => selectedConversation && loadMessages(selectedConversation)}
                className="flex-1"
              />

              {/* Typing Indicator */}
              {!messageThread.loading && !messageThread.error && (
                <TypingIndicator
                  conversationId={selectedConversation}
                  currentUserId={userId}
                  className="border-t border-border"
                />
              )}
            </div>

            {/* Message Input */}
            {!messageThread.loading && (
              <MessageInput
                onSendMessage={handleSendMessage}
                conversationId={selectedConversation}
                userId={userId}
                userName={userName}
                disabled={messageThread.error !== null}
              />
            )}
          </>
        )}
      </div>
    )
  }
)
