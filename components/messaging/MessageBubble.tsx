'use client'

import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
import { ReactElement } from 'react'
import { MessageWithSender } from '@/lib/messaging/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Flag,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { ClientOnly } from '@/components/ClientOnly'

interface MessageBubbleProps {
  message: MessageWithSender
  isCurrentUser: boolean
  onReply?: () => void
  onReport?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onHeightMeasured?: (height: number) => void
  showSenderName?: boolean
  className?: string
  showThreadIndicator?: boolean
  compact?: boolean
  onThreadOpen?: () => void
}

/**
 * MessageBubble component for displaying individual messages in conversations
 * Follows Care Collective design system and accessibility guidelines
 */
export function MessageBubble({
  message,
  isCurrentUser,
  onReply,
  onReport,
  onDelete,
  onHeightMeasured,
  showSenderName = true,
  className,
  showThreadIndicator = false,
  compact = false,
  onThreadOpen,
}: MessageBubbleProps): ReactElement {
  const messageRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device capability
  useEffect(() => {
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - legacy property
      navigator.msMaxTouchPoints > 0

    setIsTouchDevice(hasTouchScreen)
  }, [])

  // Measure height for virtualization
  useLayoutEffect(() => {
    if (onHeightMeasured && messageRef.current) {
      const height = messageRef.current.offsetHeight
      onHeightMeasured(height)
    }
  }, [onHeightMeasured, message.content])

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      // Could add toast notification here if toast system exists
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-muted-foreground" />
      case 'delivered':
        return <Check className="w-3 h-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-sage" />
      case 'failed':
        return <AlertTriangle className="w-3 h-3 text-destructive" />
      default:
        return null
    }
  }

  const getMessageTypeColor = () => {
    switch (message.message_type) {
      case 'system':
        return 'bg-muted/50 text-muted-foreground border-muted'
      case 'help_request_update':
        return 'bg-sage/10 text-sage-dark border-sage/20'
      default:
        return isCurrentUser 
          ? 'bg-sage text-white' 
          : 'bg-white text-foreground border border-border'
    }
  }

  const isSystemMessage = message.message_type === 'system'

  if (isSystemMessage) {
    // System messages are centered and styled differently
    return (
      <div className={cn("flex justify-center my-4", className)}>
        <div className="max-w-xs bg-muted/50 text-muted-foreground text-sm px-4 py-2 rounded-full border">
          <p className="text-center">{message.content}</p>
          <p className="text-xs text-center mt-1 opacity-70">
            <ClientOnly>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </ClientOnly>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex w-full mb-4 group",
        isCurrentUser ? "justify-end" : "justify-start",
        className
      )}
      role="article"
      aria-label={`Message from ${message.sender.name}`}
    >
      <div 
        className={cn(
          "max-w-[75%] sm:max-w-md space-y-1",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (for non-current users or if explicitly requested) */}
        {showSenderName && !isCurrentUser && (
          <div className="px-2">
            <p className="text-xs text-muted-foreground font-medium">
              {message.sender.name}
              {message.sender.location && (
                <span className="text-muted-foreground/70 ml-1">
                  • {message.sender.location}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={cn(
            "relative px-4 py-3 rounded-2xl shadow-sm break-words",
            getMessageTypeColor(),
            // Rounded corner adjustments for message direction
            isCurrentUser 
              ? "rounded-br-sm" 
              : "rounded-bl-sm"
          )}
        >
          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Message actions removed - simplified UX per user feedback */}
          {/* Previous dropdown menu with copy/reply/report/delete actions removed */}
        </div>

        {/* Timestamp and status */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 text-xs text-muted-foreground",
            isCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          <time dateTime={message.created_at}>
            <ClientOnly>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </ClientOnly>
          </time>
          
          {/* Show status icon only for current user's messages */}
          {isCurrentUser && (
            <>
              <span className="text-muted-foreground/50">•</span>
              {getStatusIcon()}
            </>
          )}

          {/* Flagged indicator */}
          {message.is_flagged && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <Flag className="w-3 h-3 text-yellow-600" />
              <span className="text-yellow-600">Flagged</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}