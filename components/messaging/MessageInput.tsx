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
  conversationId
}: MessageInputProps): ReactElement {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      setError(validation.error.errors[0]?.message || 'Invalid message content')
      return
    }

    try {
      setIsSending(true)
      setError(null)
      
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

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
    
    // Prevent newlines if at character limit
    if (e.key === 'Enter' && content.length >= maxLength) {
      e.preventDefault()
    }
  }

  // Auto-resize on mount and content changes
  useEffect(() => {
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  const characterCount = content.length
  const isAtLimit = characterCount >= maxLength
  const isNearLimit = characterCount >= maxLength * 0.8
  const canSend = content.trim().length > 0 && !isSending && !disabled

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="space-y-3"
      >
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

        {/* Send button and shortcuts */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
              Ctrl+Enter
            </kbd>{' '}
            to send
          </div>

          <Button
            type="submit"
            disabled={!canSend}
            className={cn(
              "bg-sage hover:bg-sage-dark text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 hover:shadow-md"
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