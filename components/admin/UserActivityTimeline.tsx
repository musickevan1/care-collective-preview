'use client'

import React, { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Database } from '@/lib/database.types'

type HelpRequest = Database['public']['Tables']['help_requests']['Row']
type ContactExchange = Database['public']['Tables']['contact_exchanges']['Row']
type Message = Database['public']['Tables']['messages']['Row']

interface ActivityItem {
  id: string
  type: 'request_created' | 'request_helped' | 'contact_exchange' | 'message_sent'
  timestamp: string
  title: string
  description: string
  status?: string
  category?: string
}

interface UserActivityTimelineProps {
  helpRequestsCreated: HelpRequest[]
  helpRequestsHelped: HelpRequest[]
  contactExchanges: ContactExchange[]
  messages: Message[]
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 30) {
    return `${diffInDays}d ago`
  } else {
    return `${Math.floor(diffInDays / 30)}mo ago`
  }
}

export function UserActivityTimeline({
  helpRequestsCreated,
  helpRequestsHelped,
  contactExchanges,
  messages
}: UserActivityTimelineProps): ReactElement {
  
  // Combine all activities into a single timeline
  const activities = [
    ...helpRequestsCreated.map(request => ({
      id: `request-${request.id}`,
      type: 'request_created' as const,
      timestamp: request.created_at ?? '',
      title: 'Created help request',
      description: request.title ?? '',
      status: request.status ?? undefined,
      category: request.category ?? undefined
    })),
    ...helpRequestsHelped.map(request => ({
      id: `helped-${request.id}`,
      type: 'request_helped' as const,
      timestamp: request.helped_at ?? request.updated_at ?? request.created_at ?? '',
      title: 'Provided help',
      description: request.title ?? '',
      status: request.status ?? undefined,
      category: request.category ?? undefined
    })),
    ...contactExchanges.map(exchange => ({
      id: `exchange-${exchange.id}`,
      type: 'contact_exchange' as const,
      timestamp: exchange.exchanged_at ?? '',
      title: 'Contact information exchanged',
      description: `${exchange.exchange_type ?? 'Unknown'} contact shared`,
      status: exchange.confirmed_at ? 'confirmed' : 'pending'
    })),
    ...messages.map(message => ({
      id: `message-${message.id}`,
      type: 'message_sent' as const,
      timestamp: message.created_at ?? '',
      title: 'Sent message',
      description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      status: message.read_at ? 'read' : 'unread'
    }))
  ] as ActivityItem[]

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'request_created':
        return '📝'
      case 'request_helped':
        return '🤝'
      case 'contact_exchange':
        return '📞'
      case 'message_sent':
        return '💬'
      default:
        return '⚡'
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'request_created':
        return 'bg-dusty-rose-accessible'
      case 'request_helped':
        return 'bg-sage-accessible'
      case 'contact_exchange':
        return 'bg-terracotta'
      case 'message_sent':
        return 'bg-accent'
      default:
        return 'bg-gray-500'
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📅</div>
        <div className="font-medium">No activity yet</div>
        <div className="text-sm">Activity will appear here as the user interacts with the platform</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-lg font-semibold text-gray-900">Activity Timeline</div>
        <Badge variant="outline" className="text-xs">
          {activities.length} events
        </Badge>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white relative z-10`}>
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                  
                  {activity.status && activity.type === 'request_created' && (
                    <StatusBadge status={activity.status as any} />
                  )}
                  
                  {activity.status && activity.type === 'contact_exchange' && (
                    <Badge className={`text-xs ${
                      activity.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {activity.status}
                    </Badge>
                  )}
                  
                  {activity.status && activity.type === 'message_sent' && (
                    <Badge className={`text-xs ${
                      activity.status === 'read' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {activity.status}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  {activity.description}
                </div>
                
                {activity.category && (
                  <Badge className="text-xs bg-sage/10 text-sage-dark border-sage/20">
                    {activity.category}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {activities.length > 10 && (
        <div className="text-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Showing latest 10 activities
          </div>
        </div>
      )}
    </div>
  )
}