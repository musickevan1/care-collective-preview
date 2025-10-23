'use client'

import React, { useRef, useLayoutEffect } from 'react'
import { ReactElement } from 'react'
import { MessageWithSender } from '@/lib/messaging/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Flag, 
  Trash2, 
  Copy,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  showThreadIndicator = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  compact = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  onThreadOpen, // eslint-disable-line @typescript-eslint/no-unused-vars
}: MessageBubbleProps): ReactElement {
  const messageRef = useRef<HTMLDivElement>(null)

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
  const isSpecialMessage = message.message_type !== 'text'

  if (isSystemMessage) {
    // System messages are centered and styled differently
    return (
      <div className={cn("flex justify-center my-4", className)}>
        <div className="max-w-xs bg-muted/50 text-muted-foreground text-sm px-4 py-2 rounded-full border">
          <p className="text-center">{message.content}</p>
          <p className="text-xs text-center mt-1 opacity-70">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
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
          {/* Special message indicator */}
          {isSpecialMessage && (
            <Badge 
              variant="outline" 
              className="mb-2 text-xs bg-background/80"
            >
              {message.message_type === 'help_request_update' 
                ? 'Help Request Update' 
                : message.message_type
              }
            </Badge>
          )}

          {/* Message content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Message actions dropdown (only visible on hover/focus) */}
          <div 
            className={cn(
              "absolute -top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10",
              isCurrentUser ? "-left-2" : "-right-2"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-background/95 border shadow-sm hover:bg-muted"
                  aria-label="Message actions"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "start" : "end"}>
                <DropdownMenuItem onClick={handleCopyMessage}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy message
                </DropdownMenuItem>
                
                {onReply && (
                  <DropdownMenuItem onClick={onReply}>
                    Reply
                  </DropdownMenuItem>
                )}
                
                {!isCurrentUser && onReport && (
                  <DropdownMenuItem 
                    onClick={() => onReport(message.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report message
                  </DropdownMenuItem>
                )}
                
                {isCurrentUser && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(message.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timestamp and status */}
        <div 
          className={cn(
            "flex items-center gap-1 px-2 text-xs text-muted-foreground",
            isCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          <time dateTime={message.created_at}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
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