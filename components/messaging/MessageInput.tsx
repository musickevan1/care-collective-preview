'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Send,
  Paperclip,
  Smile,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { messagingValidation } from '@/lib/messaging/types'
import { useTypingStatus } from './TypingIndicator'

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: 'text' | 'help_request_update') => Promise<void>
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  minHeight?: string
  showCharacterCount?: boolean
  autoFocus?: boolean
  className?: string
  conversationId?: string
  userId?: string
  userName?: string
  enableTypingStatus?: boolean
  conversationStatus?: 'pending' | 'accepted' | 'rejected'
  'data-component'?: string
}

/**
 * MessageInput component for composing and sending messages
 * Features: Character count, validation, keyboard shortcuts, accessibility
 */
export function MessageInput({
  onSendMessage,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 1000,
  minHeight = "60px",
  showCharacterCount = true,
  autoFocus = false,
  className,
  conversationId,
  userId,
  userName,
  enableTypingStatus = true,
  conversationStatus,
  'data-component': dataComponent
}: MessageInputProps): ReactElement {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Detect touch device capability for mobile-optimized keyboard shortcuts
  useEffect(() => {
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - legacy property
      navigator.msMaxTouchPoints > 0

    setIsTouchDevice(hasTouchScreen)
  }, [])

  // Typing status management
  const { broadcastTypingStart, broadcastTypingStop } = useTypingStatus({
    conversationId: conversationId || '',
    userId: userId || '',
    userName: userName || '',
    enabled: enableTypingStatus && !!conversationId && !!userId && !!userName
  })

  // Auto-resize textarea as content grows
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = minHeight
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 120 // Max height before scrolling
      
      if (scrollHeight > parseInt(minHeight)) {
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      }
    }
  }, [minHeight])

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value

    if (newContent.length <= maxLength) {
      setContent(newContent)
      setError(null)

      // Broadcast typing status if user is typing
      if (newContent.trim().length > 0 && content.trim().length === 0) {
        broadcastTypingStart()
      } else if (newContent.trim().length === 0 && content.trim().length > 0) {
        broadcastTypingStop()
      } else if (newContent.trim().length > 0) {
        broadcastTypingStart() // Continue typing signal
      }
    }

    adjustTextareaHeight()
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!content.trim() || isSending || disabled) {
      return
    }

    // Validate message content
    const validation = messagingValidation.messageContent.safeParse(content.trim())
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid message content')
      return
    }

    try {
      setIsSending(true)
      setError(null)

      // Stop typing indicator before sending
      broadcastTypingStop()

      await onSendMessage(content.trim())

      // Clear input after successful send
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = minHeight
        textareaRef.current.focus() // Keep focus for continued typing
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Handle keyboard shortcuts - different behavior for mobile vs desktop
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isTouchDevice) {
        // Mobile: Enter sends, Shift+Enter adds newline
        if (!e.shiftKey) {
          e.preventDefault()
          handleSendMessage()
        }
        // Shift+Enter allows newline (default behavior)
      } else {
        // Desktop: Ctrl/Cmd+Enter sends, Enter adds newline
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleSendMessage()
        }
        // Plain Enter allows newline (default behavior)
      }

      // Prevent newlines if at character limit
      if (content.length >= maxLength) {
        e.preventDefault()
      }
    }
  }

  // Auto-resize on mount and content changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  const characterCount = content.length
  const isAtLimit = characterCount >= maxLength
  const isNearLimit = characterCount >= maxLength * 0.8
  const isPending = conversationStatus === 'pending'
  const isRejected = conversationStatus === 'rejected'
  const canSend = content.trim().length > 0 && !isSending && !disabled && !isPending && !isRejected

  return (
    <div
      className={cn("border-t bg-background p-3 sm:p-4 pb-safe", className)}
      data-component={dataComponent}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="space-y-2"
      >
        {/* Pending conversation notice */}
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50/80 border border-yellow-200/60 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This conversation is pending. You can send messages once the recipient accepts your offer to help.
            </span>
          </div>
        )}

        {/* Rejected conversation notice */}
        {isRejected && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50/80 border border-red-200/60 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This offer was declined. You cannot send messages in this conversation.
            </span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unified Input Bar - Organic warmth aesthetic */}
        <div className={cn(
          "flex items-end gap-2 p-2 rounded-2xl",
          "bg-muted/25 border border-border/40",
          "transition-all duration-200",
          "focus-within:bg-muted/35 focus-within:border-sage/30 focus-within:shadow-sm"
        )}>
          <Label htmlFor="message-input" className="sr-only">
            Message content
          </Label>

          {/* Textarea - blends into container */}
          <div className="flex-1 relative group">
            <Textarea
              id="message-input"
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending || isPending || isRejected}
              autoFocus={autoFocus}
              data-testid="message-input"
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none",
                "bg-transparent border-0",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "px-3 py-2.5 text-sm leading-relaxed",
                "placeholder:text-muted-foreground/60",
                isAtLimit && "text-destructive"
              )}
              style={{ height: minHeight }}
              rows={1}
              aria-describedby={showCharacterCount ? "character-count" : undefined}
            />

            {/* Character count - subtle, only prominent when near limit */}
            {showCharacterCount && (
              <span
                id="character-count"
                className={cn(
                  "absolute bottom-1.5 right-2 text-[10px] tabular-nums transition-opacity duration-200",
                  isAtLimit
                    ? "text-destructive font-medium opacity-100"
                    : isNearLimit
                      ? "text-yellow-600 opacity-100"
                      : "text-muted-foreground/50 opacity-0 group-focus-within:opacity-100"
                )}
                aria-live="polite"
              >
                {characterCount}/{maxLength}
              </span>
            )}
          </div>

          {/* Circular Send Button - inline with input */}
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            data-testid="send-button"
            className={cn(
              "shrink-0 h-11 w-11 rounded-full",
              "bg-sage hover:bg-sage-dark text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted",
              "transition-all duration-200",
              "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              "messaging-action-button"
            )}
            aria-label={isSending ? "Sending message..." : "Send message"}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Keyboard hint - subtle */}
        <p className="text-[10px] text-muted-foreground/50 text-center">
          {isTouchDevice ? 'Enter to send' : 'Ctrl+Enter to send'}
        </p>

        {/* Accessibility hints */}
        <div className="sr-only" aria-live="polite">
          {isSending && "Message is being sent"}
          {error && `Error: ${error}`}
          {isAtLimit && "Character limit reached"}
        </div>
      </form>
    </div>
  )
}