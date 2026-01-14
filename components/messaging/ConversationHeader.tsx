'use client'

import { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationWithDetails } from '@/lib/messaging/types'
import { PresenceIndicator } from './PresenceIndicator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, MoreVertical, Search, Flag, LogOut } from 'lucide-react'

interface ConversationHeaderProps {
  conversation: ConversationWithDetails
  userId: string
  isMobile: boolean
  onBack?: () => void
  className?: string
  'data-component'?: string
}

/**
 * ConversationHeader - Displays conversation details and participant information
 *
 * Features:
 * - Participant name with presence indicator
 * - Help request title with responsive truncation
 * - Back button for mobile navigation
 * - Dropdown menu with Browse Requests, Report, Leave options
 *
 * @component
 */
export function ConversationHeader({
  conversation,
  userId,
  isMobile,
  onBack,
  className,
  'data-component': dataComponent
}: ConversationHeaderProps): ReactElement {
  const router = useRouter()
  const otherParticipant = conversation.participants.find(p => p.user_id !== userId)

  const handleBrowseRequests = () => {
    router.push('/requests')
  }

  const handleReport = () => {
    // TODO: Implement report dialog - will open modal
  }

  const handleLeave = () => {
    // TODO: Implement leave/archive functionality - will call API
  }

  return (
    <div
      className={`flex-shrink-0 border-b border-border p-3 sm:p-4 bg-background ${className || ''}`}
      data-component={dataComponent}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left Section: Back button + Participant Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile Back Button */}
          {isMobile && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Back to conversations"
              className="messaging-action-button h-[44px] w-[44px] flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          {/* Participant Avatar */}
          <Avatar
            name={otherParticipant?.name || 'Unknown User'}
            avatarUrl={otherParticipant?.avatar_url}
            size="md"
            className="flex-shrink-0"
          />

          {/* Participant Name + Help Request Title */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span className="truncate">{otherParticipant?.name || 'Unknown User'}</span>
              {otherParticipant && (
                <PresenceIndicator
                  userId={otherParticipant.user_id}
                  showStatus={false}
                />
              )}
            </h3>
            {/* Help Request Title - Full title with responsive truncation */}
            {conversation.help_request && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[280px] md:max-w-[400px] lg:max-w-[500px]">
                {conversation.help_request.title}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Urgency Badge + Menu */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Urgency Badge - only show urgent/critical */}
          {conversation.help_request && conversation.help_request.urgency !== 'normal' && (
            <Badge
              variant="outline"
              className={conversation.help_request.urgency === 'critical'
                ? 'bg-red-500/10 text-red-600 border-red-500/30 text-xs'
                : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 text-xs'
              }
            >
              {conversation.help_request.urgency}
            </Badge>
          )}

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="More options"
                className="messaging-action-button h-[44px] w-[44px]"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleBrowseRequests} className="cursor-pointer min-h-[44px] py-3">
                <Search className="w-4 h-4 mr-2" />
                Browse Requests
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReport} className="cursor-pointer min-h-[44px] py-3">
                <Flag className="w-4 h-4 mr-2" />
                Report Conversation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLeave}
                className="cursor-pointer min-h-[44px] py-3 text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
