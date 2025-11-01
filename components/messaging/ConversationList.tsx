'use client'

import React from 'react'
import { ReactElement } from 'react'
import { ConversationWithDetails } from '@/lib/messaging/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  MessageCircle, 
  User,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  selectedConversationId?: string
  onConversationSelect: (conversationId: string) => void
  loading?: boolean
  error?: string | null
  emptyStateTitle?: string
  emptyStateDescription?: string
  className?: string
}

interface ConversationItemProps {
  conversation: ConversationWithDetails
  isSelected: boolean
  onClick: () => void
}

/**
 * Individual conversation item component
 */
function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: ConversationItemProps): ReactElement {
  const otherParticipant = conversation.participants.find(p => p.role === 'member')
  const lastMessage = conversation.last_message
  
  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'urgent':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-sage text-white'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'closed':
        return <CheckCircle className="w-3 h-3" />
      case 'in_progress':
        return <Clock className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full h-auto p-4 justify-start text-left relative",
        "hover:bg-muted/50 transition-colors duration-200",
        "border border-transparent hover:border-muted",
        isSelected && "bg-sage/10 border-sage/30 shadow-sm"
      )}
      aria-pressed={isSelected}
      role="option"
      tabIndex={0}
    >
      <div className="w-full space-y-3">
        {/* Header: Participant info and help request */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
            </div>
            
            {otherParticipant?.location && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  {otherParticipant.location}
                </span>
              </div>
            )}
          </div>

          {/* Unread count badge */}
          {conversation.unread_count > 0 && (
            <Badge 
              className="bg-sage text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center"
              aria-label={`${conversation.unread_count} unread messages`}
            >
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Badge>
          )}
        </div>

        {/* Help request context (if applicable) */}
        {conversation.help_request && (
          <div className="bg-muted/30 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs px-2 py-0.5", getUrgencyColor(conversation.help_request.urgency))}
              >
                {conversation.help_request.urgency}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getStatusIcon(conversation.help_request.status)}
                <span className="capitalize">{conversation.help_request.status.replace('_', ' ')}</span>
              </div>
            </div>
            <h4 className="text-sm font-medium text-foreground line-clamp-1">
              {conversation.help_request.title}
            </h4>
            <Badge variant="outline" className="text-xs">
              {conversation.help_request.category}
            </Badge>
          </div>
        )}

        {/* Last message preview */}
        {lastMessage && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground line-clamp-2 break-words">
              {lastMessage.message_type === 'system' 
                ? `System: ${lastMessage.content}` 
                : lastMessage.content
              }
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{lastMessage.sender_name}</span>
              <span>•</span>
              <time dateTime={lastMessage.created_at}>
                {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
              </time>
            </div>
          </div>
        )}

        {/* Conversation metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>
              {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
            </span>
          </div>

          <time dateTime={conversation.last_message_at}>
            Updated {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </time>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage rounded-r" />
      )}
    </Button>
  )
}

/**
 * ConversationList component for displaying and selecting conversations
 * Features: Unread counts, help request context, real-time updates, accessibility
 */
export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  loading = false,
  error = null,
  emptyStateTitle = "No conversations yet",
  emptyStateDescription = "Start a conversation by offering help on a request",
  className
}: ConversationListProps): ReactElement {
  if (loading) {
    return (
      <div className={cn("flex-1 p-6", className)}>
        <div className="space-y-4">
          {/* Loading skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded-full" />
                    <div className="w-24 h-4 bg-muted rounded" />
                  </div>
                  <div className="w-6 h-4 bg-muted rounded-full" />
                </div>
                <div className="w-full h-3 bg-muted rounded" />
                <div className="w-3/4 h-3 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-6", className)}>
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive mb-2">Failed to load conversations</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-6", className)}>
        <div className="text-center space-y-4 max-w-md">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">{emptyStateTitle}</h3>
            <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.href = '/requests'}
          >
            Browse Help Requests
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div 
          className="p-2 space-y-1"
          role="listbox" 
          aria-label="Conversations"
        >
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}