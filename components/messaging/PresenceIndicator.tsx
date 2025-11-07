'use client'

import { useState, useEffect, useMemo } from 'react'
import { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { errorTracker } from '@/lib/error-tracking'
import { format } from 'date-fns'

interface PresenceIndicatorProps {
  userId: string
  showStatus?: boolean
  className?: string
}

type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

/**
 * PresenceIndicator - Shows real-time user presence status
 * Features: Online/offline detection, automatic status updates
 */
export function PresenceIndicator({
  userId,
  showStatus = false,
  className
}: PresenceIndicatorProps): ReactElement {
  const [status, setStatus] = useState<PresenceStatus>('offline')
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!userId) return

    // Fetch initial presence status from database
    const fetchPresenceStatus = async () => {
      try {
        const { data: presence, error } = await supabase
          .from('user_presence')
          .select('status, last_seen, updated_at')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          throw error;
        }

        if (presence) {
          // Check if user was last seen more than 5 minutes ago
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const lastSeenDate = new Date(presence.last_seen);

          const currentStatus = lastSeenDate < fiveMinutesAgo ? 'offline' : presence.status;

          setStatus(currentStatus as PresenceStatus);
          setLastSeen(presence.last_seen);
        } else {
          setStatus('offline');
        }
      } catch (error) {
        errorTracker.captureError(error as Error, {
          component: 'PresenceIndicator',
          action: 'fetch_initial_presence',
          severity: 'low'
        });
        setStatus('offline');
      }
    };

    fetchPresenceStatus();

    // Subscribe to real-time presence updates
    const channel = supabase
      .channel(`presence:user:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        try {
          const presence = payload.new as any;

          if (presence) {
            // Check if user is recently active
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const lastSeenDate = new Date(presence.last_seen);

            const currentStatus = lastSeenDate < fiveMinutesAgo ? 'offline' : presence.status;

            setStatus(currentStatus as PresenceStatus);
            setLastSeen(presence.last_seen);
          }
        } catch (error) {
          errorTracker.captureError(error as Error, {
            component: 'PresenceIndicator',
            action: 'process_presence_update',
            severity: 'low'
          });
        }
      })
      // Fallback to broadcast events for compatibility
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userPresence = state[userId]

        if (userPresence && userPresence.length > 0) {
          const latestPresence = userPresence[0]
          setStatus(latestPresence.status || 'offline')
          setLastSeen(latestPresence.last_seen || null)
        } else {
          setStatus('offline')
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === userId) {
          const presence = newPresences[0]
          setStatus(presence.status || 'online')
          setLastSeen(presence.last_seen || null)
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === userId) {
          setStatus('offline')
          setLastSeen(new Date().toISOString())
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const getStatusColor = (status: PresenceStatus): string => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: PresenceStatus): string => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'away':
        return 'Away'
      case 'busy':
        return 'Busy'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  const formatLastSeen = (lastSeen: string | null): string => {
    if (!lastSeen) return ''

    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffMs = now.getTime() - lastSeenDate.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return format(lastSeenDate, 'MMM d, yyyy')
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status dot */}
      <div
        className={cn(
          "w-2 h-2 rounded-full border border-white",
          getStatusColor(status)
        )}
        title={`${getStatusText(status)}${lastSeen && status === 'offline' ? ` • Last seen ${formatLastSeen(lastSeen)}` : ''}`}
        aria-label={`User is ${getStatusText(status).toLowerCase()}`}
      />

      {/* Optional status text */}
      {showStatus && (
        <span className="text-xs text-muted-foreground">
          {status === 'offline' && lastSeen
            ? `Last seen ${formatLastSeen(lastSeen)}`
            : getStatusText(status)
          }
        </span>
      )}
    </div>
  )
}

/**
 * Hook for managing current user's presence status
 */
interface UsePresenceStatusOptions {
  userId: string
  enabled?: boolean
}

interface UsePresenceStatusReturn {
  updateStatus: (status: PresenceStatus) => void
  currentStatus: PresenceStatus
}

export function usePresenceStatus({
  userId,
  enabled = true
}: UsePresenceStatusOptions): UsePresenceStatusReturn {
  const [currentStatus, setCurrentStatus] = useState<PresenceStatus>('online')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!enabled || !userId) return

    const updatePresenceInDatabase = async (status: PresenceStatus) => {
      try {
        await supabase.rpc('update_user_presence', {
          user_uuid: userId,
          new_status: status
        });
      } catch (error) {
        errorTracker.captureError(error as Error, {
          component: 'usePresenceStatus',
          action: 'update_presence_database',
          severity: 'low'
        });
      }
    };

    const channel = supabase.channel(`presence:user:${userId}`)

    const trackPresence = async (status: PresenceStatus = 'online') => {
      // Update database
      await updatePresenceInDatabase(status);

      // Also track in channel for compatibility
      channel.track({
        user_id: userId,
        status,
        last_seen: new Date().toISOString()
      });
    }

    // Start tracking presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackPresence('online')
        setCurrentStatus('online')
      }
    })

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      const newStatus = document.hidden ? 'away' : 'online'
      await trackPresence(newStatus)
      setCurrentStatus(newStatus)
    }

    // Handle beforeunload to mark as offline
    const handleBeforeUnload = () => {
      // Use synchronous approach for beforeunload
      updatePresenceInDatabase('offline')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Update presence every 30 seconds to maintain online status
    const presenceInterval = setInterval(async () => {
      if (!document.hidden) {
        await trackPresence(currentStatus)
      }
    }, 30000)

    return () => {
      updatePresenceInDatabase('offline')
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(presenceInterval)
    }
  }, [userId, enabled, currentStatus, supabase])

  const updateStatus = async (status: PresenceStatus) => {
    if (!enabled || !userId) return

    try {
      await supabase.rpc('update_user_presence', {
        user_uuid: userId,
        new_status: status
      });

      // Also update broadcast channel
      const channel = supabase.channel(`presence:user:${userId}`)
      channel.track({
        user_id: userId,
        status,
        last_seen: new Date().toISOString()
      });

      setCurrentStatus(status)
    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'usePresenceStatus',
        action: 'update_status',
        severity: 'low'
      });
    }
  }

  return {
    updateStatus,
    currentStatus
  }
}