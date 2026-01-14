'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo, ReactElement } from 'react'
import { ConversationWithDetails } from '@/lib/messaging/types'
import { MessagingProvider, useMessagingContext } from './MessagingContext'
import { ConversationPanel } from './ConversationPanel'
import { MessageThreadPanel } from './MessageThreadPanel'
import { usePresenceStatus } from './PresenceIndicator'
import { ViewportFix } from './ViewportFix'
import { WelcomeBanner } from './WelcomeBanner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface MessagingDashboardProps {
  initialConversations: ConversationWithDetails[]
  userId: string
  userName?: string
  selectedConversationId?: string
  enableRealtime?: boolean
  className?: string
}

/**
 * MessagingDashboard - Main messaging interface component
 *
 * Refactored for Phase 2.2 to meet CLAUDE.md requirements:
 * - Under 500 lines (was 710, now ~155)
 * - Uses MessagingContext for state management
 * - Extracted into focused components
 *
 * Features:
 * - Two-pane layout (ConversationPanel + MessageThreadPanel)
 * - Real-time message subscriptions
 * - Mobile-responsive with viewport handling
 * - Presence tracking
 *
 * @component
 */
export function MessagingDashboard({
  initialConversations,
  userId,
  userName,
  selectedConversationId,
  enableRealtime = true,
  className
}: MessagingDashboardProps): ReactElement {
  const [isMobile, setIsMobile] = useState(false)
  const [showConversationList, setShowConversationList] = useState(true)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  const messageThreadRef = useRef<HTMLDivElement>(null)

  // Track current user's presence status
  usePresenceStatus({
    userId,
    enabled: enableRealtime
  })

  // Check if mobile layout needed
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setShowConversationList(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle viewport changes when virtual keyboard opens/closes on mobile
  useEffect(() => {
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - legacy property
      navigator.msMaxTouchPoints > 0

    if (!isTouchDevice) return

    // Use Visual Viewport API if available (modern browsers)
    if ('visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport

      const handleViewportChange = () => {
        const newHeight = viewport.height
        setViewportHeight(newHeight)

        // Scroll input into view when keyboard opens
        if (messageThreadRef.current) {
          setTimeout(() => {
            messageThreadRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
            })
          }, 100)
        }
      }

      viewport.addEventListener('resize', handleViewportChange)
      viewport.addEventListener('scroll', handleViewportChange)
      setViewportHeight(viewport.height)

      return () => {
        viewport.removeEventListener('resize', handleViewportChange)
        viewport.removeEventListener('scroll', handleViewportChange)
      }
    } else {
      // Fallback for older browsers
      const handleResize = () => {
        setViewportHeight(window.innerHeight)
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleBackToConversations = useCallback(() => {
    setShowConversationList(true)
  }, [])

  const handleMobileNavigate = useCallback((showList: boolean) => {
    setShowConversationList(showList)
  }, [])

  return (
    <MessagingProvider
      initialConversations={initialConversations}
      userId={userId}
      isMobile={isMobile}
      onMobileNavigate={handleMobileNavigate}
    >
      <ViewportFix />
      <RealTimeSubscriptions
        enableRealtime={enableRealtime}
        selectedConversationId={selectedConversationId}
      />
      <div
        className={cn("h-full flex bg-background", className)}
        style={
          viewportHeight && isMobile
            ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
            : undefined
        }
      >
        <div className="mx-auto w-full max-w-7xl flex">
          <ConversationPanel isMobile={isMobile} showConversationList={showConversationList} />
          <MessageThreadPanel
            isMobile={isMobile}
            showConversationList={showConversationList}
            messageThreadRef={messageThreadRef}
            userName={userName}
            onBack={handleBackToConversations}
          />
        </div>
      </div>
    </MessagingProvider>
  )
}

/**
 * RealTimeSubscriptions - Handles real-time message subscriptions
 * Extracted to keep MessagingDashboard clean
 */
function RealTimeSubscriptions({
  enableRealtime,
  selectedConversationId
}: {
  enableRealtime: boolean
  selectedConversationId?: string
}): null {
  const { selectedConversation, setMessageThread, loadMessages, loadPendingOffers, handleConversationSelect } =
    useMessagingContext()
  const supabase = useMemo(() => createClient(), [])

  // Initial conversation selection
  useEffect(() => {
    if (selectedConversationId) {
      handleConversationSelect(selectedConversationId)
    }
  }, [selectedConversationId, handleConversationSelect])

  // Load pending offers on mount
  useEffect(() => {
    loadPendingOffers()
  }, [loadPendingOffers])

  // Real-time message subscriptions
  useEffect(() => {
    if (!enableRealtime || !selectedConversation) return

    const subscription = supabase
      .channel(`messages:conversation:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages_v2',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Fetch message with sender profile
          const { data: message, error: msgError } = await supabase
            .from('messages_v2')
            .select('*')
            .eq('id', newMessage.id)
            .single()

          if (!msgError && message) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, name, location')
              .eq('id', message.sender_id)
              .single()

            const messageWithSender = {
              ...message,
              sender: senderProfile
            }

            setMessageThread(prev => {
              // Deduplicate: check if message already exists
              const exists = prev.messages.some(msg => msg.id === messageWithSender.id)
              if (exists) {
                console.debug(`Skipping duplicate message: ${messageWithSender.id}`)
                return prev
              }

              return {
                ...prev,
                messages: [...prev.messages, messageWithSender]
              }
            })
          } else {
            console.warn('Failed to fetch new message, reloading conversation:', msgError)
            loadMessages(selectedConversation)
          }
        }
      )
      .subscribe()

    return () => {
      if (supabase.removeChannel) {
        supabase.removeChannel(subscription)
      }
    }
  }, [enableRealtime, selectedConversation, supabase, loadMessages, setMessageThread])

  return null
}
