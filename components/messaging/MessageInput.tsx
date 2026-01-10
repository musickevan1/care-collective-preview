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
      className={cn("border-t bg-background p-4", className)}
      data-component={dataComponent}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="space-y-3"
      >
        {/* Pending conversation notice */}
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This conversation is pending. You can send messages once the recipient accepts your offer to help.
            </span>
          </div>
        )}

        {/* Rejected conversation notice */}
        {isRejected && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This offer was declined. You cannot send messages in this conversation.
            </span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <Label htmlFor="message-input" className="sr-only">
            Message content
          </Label>
          
          <Textarea
            id="message-input"
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            autoFocus={autoFocus}
            data-testid="message-input"
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3",
              "placeholder:text-muted-foreground",
              isAtLimit && "border-destructive focus-visible:ring-destructive"
            )}
            style={{ height: minHeight }}
            rows={1}
            aria-describedby={showCharacterCount ? "character-count" : undefined}
          />

          {/* Character count and actions */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {showCharacterCount && (
              <span 
                id="character-count"
                className={cn(
                  "text-xs",
                  isAtLimit 
                    ? "text-destructive" 
                    : isNearLimit 
                      ? "text-yellow-600" 
                      : "text-muted-foreground"
                )}
                aria-live="polite"
              >
                {characterCount}/{maxLength}
              </span>
            )}

            {/* Future: File attachment button */}
            {/* <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={disabled || isSending}
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </Button> */}
          </div>
        </div>

        {/* Send button */}
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={!canSend}
            data-testid="send-button"
            className={cn(
              "bg-sage hover:bg-sage-dark text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 hover:shadow-md",
              "messaging-action-button"
            )}
            aria-label={isSending ? "Sending message..." : "Send message"}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>

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