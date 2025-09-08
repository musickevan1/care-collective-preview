/**
 * @fileoverview Messaging status indicator for help requests
 * Shows conversation activity and unread status on help request cards
 */

'use client';

import { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  Clock,
  Eye,
  EyeOff 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MessagingStatus {
  conversationCount: number;
  unreadCount: number;
  hasActiveConversations: boolean;
  lastMessageTime?: string;
}

interface MessagingStatusIndicatorProps {
  helpRequestId: string;
  status: MessagingStatus;
  isOwnRequest?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function MessagingStatusIndicator({
  helpRequestId,
  status,
  isOwnRequest = false,
  size = 'md',
  showDetails = true,
  className
}: MessagingStatusIndicatorProps): ReactElement | null {
  const { conversationCount, unreadCount, hasActiveConversations, lastMessageTime } = status;

  // Don't show if no messaging activity
  if (conversationCount === 0 && !hasActiveConversations) {
    return null;
  }

  const sizeConfig = {
    sm: {
      badge: 'text-xs px-2 py-0.5',
      icon: 'w-3 h-3',
      button: 'text-xs px-2 py-1',
      text: 'text-xs'
    },
    md: {
      badge: 'text-xs px-2 py-1',
      icon: 'w-4 h-4',
      button: 'text-sm px-3 py-1.5',
      text: 'text-sm'
    },
    lg: {
      badge: 'text-sm px-3 py-1.5',
      icon: 'w-5 h-5',
      button: 'text-sm px-4 py-2',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  if (isOwnRequest) {
    // For help request owners - show conversation management
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {conversationCount > 0 && (
          <div className="flex items-center gap-1">
            <Badge 
              variant={unreadCount > 0 ? "default" : "secondary"}
              className={cn(
                config.badge,
                unreadCount > 0 
                  ? 'bg-sage text-white' 
                  : 'bg-secondary/10 text-secondary'
              )}
            >
              <MessageCircle className={cn(config.icon, 'mr-1')} />
              {conversationCount} offer{conversationCount !== 1 ? 's' : ''}
              {unreadCount > 0 && ` (${unreadCount} new)`}
            </Badge>
          </div>
        )}

        {showDetails && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className={cn(
              config.button,
              'border-sage/30 text-sage hover:bg-sage/5',
              unreadCount > 0 && 'border-sage bg-sage/5'
            )}
          >
            <Link href={`/messages?help_request=${helpRequestId}`}>
              {unreadCount > 0 ? (
                <>
                  <EyeOff className={cn(config.icon, 'mr-1')} />
                  View Messages
                </>
              ) : (
                <>
                  <Eye className={cn(config.icon, 'mr-1')} />
                  Manage Offers
                </>
              )}
            </Link>
          </Button>
        )}
      </div>
    );
  } else {
    // For other users - show if they can see activity
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {conversationCount > 0 && (
          <Badge 
            variant="secondary"
            className={cn(
              config.badge,
              'bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20'
            )}
          >
            <Users className={cn(config.icon, 'mr-1')} />
            {conversationCount} helper{conversationCount !== 1 ? 's' : ''} offering
          </Badge>
        )}

        {hasActiveConversations && (
          <Badge 
            variant="outline"
            className={cn(
              config.badge,
              'border-green-200 text-green-700 bg-green-50'
            )}
          >
            <Clock className={cn(config.icon, 'mr-1')} />
            Active
          </Badge>
        )}
      </div>
    );
  }
}

// Helper function to calculate messaging status for a help request
export async function getMessagingStatusForHelpRequest(
  helpRequestId: string,
  currentUserId?: string
): Promise<MessagingStatus> {
  try {
    const response = await fetch(
      `/api/messaging/help-requests/${helpRequestId}/conversations`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return {
        conversationCount: 0,
        unreadCount: 0,
        hasActiveConversations: false
      };
    }

    const data = await response.json();
    const conversations = data.conversations || [];

    return {
      conversationCount: conversations.length,
      unreadCount: conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0),
      hasActiveConversations: conversations.some((conv: any) => 
        conv.last_message && 
        new Date(conv.last_message.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ),
      lastMessageTime: conversations[0]?.last_message?.created_at
    };

  } catch (error) {
    console.error('Error fetching messaging status:', error);
    return {
      conversationCount: 0,
      unreadCount: 0,
      hasActiveConversations: false
    };
  }
}