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
import { Avatar } from '@/components/ui/avatar'

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
        "flex w-full mb-4 group gap-2",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end flex-row-reverse" : "justify-start",
        className
      )}
      role="article"
      aria-label={`Message from ${message.sender.name}`}
    >
      {/* Avatar */}
      {!compact && (
        <Avatar
          name={message.sender.name}
          avatarUrl={message.sender.avatar_url}
          size="md"
          className="mt-auto"
        />
      )}

      <div
        className={cn(
          "max-w-[70%] sm:max-w-md space-y-1 flex flex-col",
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
            "relative px-4 py-3 rounded-2xl break-words",
            "shadow-md hover:shadow-lg transition-all duration-200",
            getMessageTypeColor(),
            // Rounded corner adjustments for message direction (tail effect)
            isCurrentUser
              ? "rounded-tr-none"
              : "rounded-tl-none"
          )}
        >
          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Timestamp and status */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 text-xs",
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <time
            dateTime={message.created_at}
            className="text-muted-foreground"
          >
            <ClientOnly>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </ClientOnly>
          </time>

          {/* Show status icon only for current user's messages */}
          {isCurrentUser && (
            <span className="flex items-center">
              {message.status === 'read' ? (
                <CheckCheck className="w-4 h-4 text-sage" aria-label="Read" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-4 h-4 text-muted-foreground" aria-label="Delivered" />
              ) : message.status === 'sent' ? (
                <Check className="w-4 h-4 text-muted-foreground" aria-label="Sent" />
              ) : message.status === 'failed' ? (
                <AlertTriangle className="w-4 h-4 text-destructive" aria-label="Failed" />
              ) : null}
            </span>
          )}

          {/* Flagged indicator */}
          {message.is_flagged && (
            <span className="flex items-center gap-1 text-yellow-600">
              <Flag className="w-3 h-3" />
              <span>Flagged</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}