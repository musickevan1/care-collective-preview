'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { errorTracker } from '@/lib/error-tracking'

interface TypingUser {
  id: string
  name: string
  started_typing_at: string
}

interface TypingIndicatorProps {
  conversationId: string
  currentUserId: string
  className?: string
}

/**
 * TypingIndicator - Shows real-time typing status from other conversation participants
 * Features: Real-time updates, automatic cleanup, mobile-optimized animations
 */
export function TypingIndicator({
  conversationId,
  currentUserId,
  className
}: TypingIndicatorProps): ReactElement {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!conversationId || !currentUserId) return

    // Subscribe to user presence changes for typing indicators
    const channel = supabase
      .channel(`presence:conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_presence',
        filter: `is_typing_in_conversation=eq.${conversationId}`
      }, async (payload) => {
        try {
          const presence = payload.new as any;

          if (presence.user_id === currentUserId) return; // Don't show own typing

          // Get user info
          const { data: user } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', presence.user_id)
            .single();

          if (presence.is_typing_in_conversation === conversationId) {
            setTypingUsers(prev => {
              const filtered = prev.filter(u => u.id !== presence.user_id);
              return [...filtered, {
                id: presence.user_id,
                name: user?.name || 'Someone',
                started_typing_at: new Date().toISOString()
              }];
            });
          } else {
            setTypingUsers(prev => prev.filter(u => u.id !== presence.user_id));
          }
        } catch (error) {
          errorTracker.captureError(error as Error, {
            component: 'TypingIndicator',
            action: 'process_typing_update',
            severity: 'low'
          });
        }
      })
      // Also listen for broadcast events for compatibility
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        const { user_id, user_name } = payload.payload

        if (user_id === currentUserId) return

        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.id !== user_id)
          return [...filtered, {
            id: user_id,
            name: user_name || 'Someone',
            started_typing_at: new Date().toISOString()
          }]
        })
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        const { user_id } = payload.payload
        setTypingUsers(prev => prev.filter(u => u.id !== user_id))
      })
      .subscribe()

    // Clean up typing indicators that are too old (30 seconds)
    const cleanupInterval = setInterval(() => {
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()

      setTypingUsers(prev =>
        prev.filter(user => user.started_typing_at > thirtySecondsAgo)
      )
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(cleanupInterval)
    }
  }, [conversationId, currentUserId, supabase])

  if (typingUsers.length === 0) {
    return <div className={cn("h-6", className)} />
  }

  const displayNames = typingUsers.map(user => user.name)
  const typingText = displayNames.length === 1
    ? `${displayNames[0]} is typing...`
    : displayNames.length === 2
    ? `${displayNames[0]} and ${displayNames[1]} are typing...`
    : `${displayNames[0]} and ${displayNames.length - 1} others are typing...`

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={typingText}
    >
      <div className="flex gap-1 items-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-sage rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: '1000ms'
            }}
          />
        ))}
      </div>
      <span className="animate-in fade-in duration-200">{typingText}</span>
    </div>
  )
}

/**
 * Hook for managing typing status broadcasting
 */
interface UseTypingStatusOptions {
  conversationId: string
  userId: string
  userName: string
  enabled?: boolean
}

interface UseTypingStatusReturn {
  broadcastTypingStart: () => void
  broadcastTypingStop: () => void
  isTyping: boolean
}

export function useTypingStatus({
  conversationId,
  userId,
  userName,
  enabled = true
}: UseTypingStatusOptions): UseTypingStatusReturn {
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const broadcastTypingStop = useCallback(async () => {
    if (!enabled || !conversationId || !userId) return

    try {
      setIsTyping(false)

      if (typingTimeout) {
        clearTimeout(typingTimeout)
        setTypingTimeout(null)
      }

      // Update user presence to stop typing
      await supabase.rpc('update_user_presence', {
        user_uuid: userId,
        new_status: 'online',
        conversation_uuid: conversationId,
        typing_in_conversation: null
      });

      // Also broadcast for compatibility
      supabase
        .channel(`presence:conversation:${conversationId}`)
        .send({
          type: 'broadcast',
          event: 'typing_stop',
          payload: {
            user_id: userId,
            conversation_id: conversationId
          }
        });
    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'useTypingStatus',
        action: 'broadcast_typing_stop',
        severity: 'low'
      });
    }
  }, [enabled, conversationId, userId, typingTimeout, supabase])

  const broadcastTypingStart = useCallback(async () => {
    if (!enabled || !conversationId || !userId) return

    try {
      if (!isTyping) {
        setIsTyping(true)

        // Update user presence to show typing
        await supabase.rpc('update_user_presence', {
          user_uuid: userId,
          new_status: 'online',
          conversation_uuid: conversationId,
          typing_in_conversation: conversationId
        });

        // Also broadcast for real-time compatibility
        supabase
          .channel(`presence:conversation:${conversationId}`)
          .send({
            type: 'broadcast',
            event: 'typing_start',
            payload: {
              user_id: userId,
              user_name: userName,
              conversation_id: conversationId
            }
          });
      }

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }

      // Set timeout to automatically stop typing after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        broadcastTypingStop()
      }, 3000)

      setTypingTimeout(timeout)
    } catch (error) {
      errorTracker.captureError(error as Error, {
        component: 'useTypingStatus',
        action: 'broadcast_typing_start',
        severity: 'low'
      });
    }
  }, [enabled, conversationId, userId, userName, isTyping, typingTimeout, supabase, broadcastTypingStop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      broadcastTypingStop()
    }
  }, [typingTimeout, broadcastTypingStop])

  return {
    broadcastTypingStart,
    broadcastTypingStop,
    isTyping
  }
}