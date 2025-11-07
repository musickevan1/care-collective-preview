/**
 * @fileoverview MessagingStatusIndicator component for Care Collective
 * Displays messaging status for help requests with accessibility and Care Collective design
 */

import { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface HelpRequestMessagingStatus {
  conversationCount: number
  unreadCount: number
  hasActiveConversations: boolean
  lastMessageTime?: string
}

interface MessagingStatusIndicatorProps {
  helpRequestId: string
  status: HelpRequestMessagingStatus
  isOwnRequest: boolean
  size?: 'default' | 'lg'
  showDetails?: boolean
  className?: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return format(date, 'MMM d')
}

export function MessagingStatusIndicator({
  helpRequestId,
  status,
  isOwnRequest,
  size = 'default',
  showDetails = false,
  className
}: MessagingStatusIndicatorProps): ReactElement {
  const { conversationCount, unreadCount, hasActiveConversations, lastMessageTime } = status

  // Don't render if no conversations
  if (conversationCount === 0) {
    return <></>
  }

  const isLarge = size === 'lg'
  
  return (
    <Card className={cn(
      'border-sage/20 bg-sage/5',
      className
    )}>
      <CardContent className={cn(
        'p-4',
        isLarge && 'p-6'
      )}>
        <div className="flex items-start justify-between gap-4">
          {/* Status Information */}
          <div className="flex-1 space-y-2">
            {/* Main Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle 
                  className={cn(
                    'text-sage',
                    isLarge ? 'h-6 w-6' : 'h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <h3 className={cn(
                  'font-semibold text-secondary',
                  isLarge ? 'text-lg' : 'text-base'
                )}>
                  {conversationCount} Active Conversation{conversationCount !== 1 ? 's' : ''}
                </h3>
              </div>
              
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="bg-dusty-rose hover:bg-dusty-rose/90"
                  aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
                >
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            
            {/* Details */}
            {showDetails && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isOwnRequest 
                      ? `${conversationCount} people interested in helping`
                      : 'Conversation with request owner'
                    }
                  </span>
                </div>
                
                {lastMessageTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Last activity {formatTimeAgo(lastMessageTime)}
                    </span>
                  </div>
                )}
                
                {hasActiveConversations && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full" aria-hidden="true" />
                    <span className="text-green-700 font-medium">
                      Active conversations
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <div className="flex-shrink-0">
            <Button 
              asChild
              variant="outline"
              size={isLarge ? 'lg' : 'default'}
              className="border-sage text-sage hover:bg-sage hover:text-white"
            >
              <Link 
                href="/messages"
                aria-label={
                  unreadCount > 0 
                    ? `View messages (${unreadCount} unread)`
                    : 'View messages'
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                {unreadCount > 0 ? 'View Messages' : 'Continue Conversation'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MessagingStatusIndicator