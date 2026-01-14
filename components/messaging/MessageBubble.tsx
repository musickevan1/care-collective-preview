'use client'

import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
import { ReactElement } from 'react'
import { MessageWithSender } from '@/lib/messaging/types'
import { formatMessageTimestamp, formatTimestampForA11y } from '@/lib/utils/relative-time'
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
  // NEW: Grouping props for message grouping (Phase 2)
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
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
  isFirstInGroup = true,    // Default to true for backward compatibility
  isLastInGroup = true,
}: MessageBubbleProps): ReactElement {
  const messageRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Grouping logic: determine what to show based on position in group
  const spacingClass = isLastInGroup ? 'mb-4' : 'mb-1'
  const shouldShowAvatar = isFirstInGroup && !compact
  const shouldShowSenderName = isFirstInGroup && !isCurrentUser && showSenderName
  const shouldShowTimestamp = isFirstInGroup

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
              <time
                dateTime={message.created_at}
                title={formatTimestampForA11y(message.created_at)}
                aria-label={`Sent ${formatTimestampForA11y(message.created_at)}`}
              >
                {formatMessageTimestamp(message.created_at)}
              </time>
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
        "flex w-full group gap-2",
        spacingClass,  // Dynamic spacing based on grouping
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end flex-row-reverse" : "justify-start",
        className
      )}
      role="article"
      aria-label={`Message from ${message.sender.name}`}
    >
      {/* Avatar - only show if first in group */}
      {shouldShowAvatar && (
        <Avatar
          name={message.sender.name}
          avatarUrl={message.sender.avatar_url}
          size="md"
          className="mt-auto"
        />
      )}

      {/* Empty spacer to maintain alignment when avatar hidden */}
      {!shouldShowAvatar && !compact && (
        <div className={cn('flex-shrink-0', isCurrentUser ? 'ml-2' : 'mr-2')}>
          <div className="size-10" /> {/* Same size as Avatar size="md" (40px) */}
        </div>
      )}

      <div
        className={cn(
          "max-w-[70%] sm:max-w-[480px] space-y-1 flex flex-col",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender name - only show if first in group and not current user */}
        {shouldShowSenderName && (
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

        {/* Timestamp and status - only show if first in group */}
        {shouldShowTimestamp && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 text-xs",
              isCurrentUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <time
              dateTime={message.created_at}
              title={formatTimestampForA11y(message.created_at)}
              aria-label={`Sent ${formatTimestampForA11y(message.created_at)}`}
              className="text-muted-foreground"
            >
              <ClientOnly>
                {formatMessageTimestamp(message.created_at)}
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
        )}
      </div>
    </div>
  )
}