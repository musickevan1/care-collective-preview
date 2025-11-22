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
  messageThreadRef: React.RefObject<HTMLDivElement | null>
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
            {/* Conversation Header - Fixed at top, never scrolls */}
            <div className="flex-none">
              {messageThread.conversation && (
                <ConversationHeader
                  conversation={messageThread.conversation}
                  userId={userId}
                  isMobile={isMobile}
                  onBack={onBack}
                  data-component="ConversationHeader"
                />
              )}
            </div>

            {/* Messages Area - Scrollable middle section */}
            <div
              ref={messageThreadRef}
              className="flex-1 min-h-0 flex flex-col"
              data-tour="message-thread"
            >
              <MessageThreadView
                messages={messageThread.messages}
                loading={messageThread.loading}
                error={messageThread.error}
                userId={userId}
                onRetry={() => selectedConversation && loadMessages(selectedConversation)}
              />

              {/* Typing Indicator - Inside scroll area but at bottom */}
              {!messageThread.loading && !messageThread.error && (
                <TypingIndicator
                  conversationId={selectedConversation}
                  currentUserId={userId}
                  className="border-t border-border flex-shrink-0"
                />
              )}
            </div>

            {/* Message Input - Fixed at bottom, never scrolls */}
            <div className="flex-none" data-tour="message-input">
              {!messageThread.loading && (
                <MessageInput
                  onSendMessage={handleSendMessage}
                  conversationId={selectedConversation}
                  userId={userId}
                  userName={userName}
                  disabled={messageThread.error !== null}
                  conversationStatus={messageThread.conversation?.status}
                  data-component="MessageInput"
                />
              )}
            </div>
          </>
        )}
      </div>
    )
  }
)
