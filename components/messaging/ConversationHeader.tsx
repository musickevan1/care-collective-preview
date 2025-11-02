'use client'

import { ReactElement } from 'react'
import { ConversationWithDetails } from '@/lib/messaging/types'
import { PresenceIndicator } from './PresenceIndicator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, MoreVertical } from 'lucide-react'

interface ConversationHeaderProps {
  conversation: ConversationWithDetails
  userId: string
  isMobile: boolean
  onBack?: () => void
  className?: string
}

/**
 * ConversationHeader - Displays conversation details and participant information
 *
 * Features:
 * - Participant name with presence indicator
 * - Help request context (title, urgency)
 * - Back button for mobile navigation
 * - Menu button for future actions
 *
 * @component
 */
export function ConversationHeader({
  conversation,
  userId,
  isMobile,
  onBack,
  className
}: ConversationHeaderProps): ReactElement {
  const otherParticipant = conversation.participants.find(p => p.user_id !== userId)

  return (
    <div className={`border-b border-border p-4 bg-background ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          {isMobile && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Participant Info */}
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {otherParticipant?.name || 'Unknown User'}
              {otherParticipant && (
                <PresenceIndicator
                  userId={otherParticipant.user_id}
                  showStatus={false}
                />
              )}
            </h3>
            {conversation.help_request && (
              <p className="text-sm text-muted-foreground mt-1">
                Re: {conversation.help_request.title}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {conversation.help_request && (
            <Badge variant="outline">
              {conversation.help_request.urgency}
            </Badge>
          )}
          <Button variant="ghost" size="sm" aria-label="More options">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
