'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ReactElement } from 'react'
import { ConversationWithDetails, MessageWithSender } from '@/lib/messaging/types'
import { ConversationList } from './ConversationList'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { PresenceIndicator, usePresenceStatus } from './PresenceIndicator'
import { PendingOffersSection } from './PendingOffersSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  ArrowLeft,
  Users,
  RefreshCw,
  AlertCircle,
  Send,
  MoreVertical,
  Info,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import PullToRefresh from 'react-pull-to-refresh'

interface MessagingDashboardProps {
  initialConversations: ConversationWithDetails[]
  userId: string
  userName?: string
  selectedConversationId?: string
  enableRealtime?: boolean
  className?: string
}

interface MessageThread {
  messages: MessageWithSender[]
  conversation: ConversationWithDetails | null
  loading: boolean
  error: string | null
}

/**
 * MessagingDashboard - Main messaging interface component
 * Features: Two-pane layout, real-time updates, conversation management
 */
export function MessagingDashboard({
  initialConversations,
  userId,
  userName,
  selectedConversationId,
  enableRealtime = true,
  className
}: MessagingDashboardProps): ReactElement {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedConversationId || null)
  const [messageThread, setMessageThread] = useState<MessageThread>({
    messages: [],
    conversation: null,
    loading: false,
    error: null
  })
  const [isMobile, setIsMobile] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [showConversationList, setShowConversationList] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
  const [pendingOffers, setPendingOffers] = useState<any[]>([])
  const [isLoadingOffers, setIsLoadingOffers] = useState(false)
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageThreadRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Track current user's presence status
  usePresenceStatus({
    userId,
    enabled: enableRealtime
  })

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy property
        navigator.msMaxTouchPoints > 0
      setIsTouchDevice(isTouch)
    }
    checkTouchDevice()
  }, [])

  // Handle viewport changes when virtual keyboard opens/closes on mobile
  useEffect(() => {
    if (!isTouchDevice) return

    // Use Visual Viewport API if available (modern browsers)
    if ('visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport

      const handleViewportChange = () => {
        // When keyboard opens, viewport height decreases
        const newHeight = viewport.height
        setViewportHeight(newHeight)

        // Scroll input into view when keyboard opens
        if (messageThreadRef.current && selectedConversation) {
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

      // Set initial height
      setViewportHeight(viewport.height)

      return () => {
        viewport.removeEventListener('resize', handleViewportChange)
        viewport.removeEventListener('scroll', handleViewportChange)
      }
    } else {
      // Fallback for older browsers - use window resize
      const handleResize = () => {
        setViewportHeight(window.innerHeight)
      }

      handleResize()
      window.addEventListener('resize', handleResize)

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [selectedConversation])

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

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Custom refresh indicator with Care Collective colors
  const RefreshIndicator = useCallback((): ReactElement => (
    <div className="flex items-center justify-center py-4">
      <RefreshCw className="w-5 h-5 text-sage animate-spin" />
      <span className="ml-2 text-sm text-sage">Refreshing messages...</span>
    </div>
  ), [])

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsManualRefresh(true)
    try {
      // Reload messages for current conversation
      if (selectedConversation) {
        await loadMessages(selectedConversation)
      }
      // Also refresh conversation list
      // Note: In a full implementation, you'd reload conversations from the server
      // For now, we just reload messages which will update the conversation's timestamp
    } finally {
      setIsManualRefresh(false)
    }
  }, [selectedConversation, loadMessages])

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setMessageThread(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get conversation details (V2 has requester_id/helper_id pointing to auth.users, not profiles)
      const { data: conversation, error: convError } = await supabase
        .from('conversations_v2')
        .select(`
          *,
          help_requests (
            id,
            title,
            category,
            urgency,
            status
          )
        `)
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      // Fetch profiles separately since conversations_v2 FKs point to auth.users, not profiles
      const { data: requesterProfile, error: reqProfileError } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', conversation.requester_id)
        .single()

      if (reqProfileError) {
        console.error('Failed to fetch requester profile:', reqProfileError)
        // Continue with fallback - will use 'Unknown User' in participants array
      }

      const { data: helperProfile, error: helpProfileError } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', conversation.helper_id)
        .single()

      if (helpProfileError) {
        console.error('Failed to fetch helper profile:', helpProfileError)
        // Continue with fallback - will use 'Unknown User' in participants array
      }

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      // Fetch sender profiles for all messages
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])]
      const { data: senderProfiles, error: senderProfilesError } = await supabase
        .from('profiles')
        .select('id, name, location')
        .in('id', senderIds)

      if (senderProfilesError) {
        console.error('Failed to fetch sender profiles:', senderProfilesError)
        // Continue with empty array - messages will lack sender info but won't crash
      }

      // Map profiles to messages
      const profileMap = new Map(senderProfiles?.map(p => [p.id, p]) || [])
      const messagesWithSenders = messages?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id)
      })) || []

      // Transform conversation data - V2 has direct requester/helper, not participants table
      const participants = [
        {
          user_id: requesterProfile?.id || conversation.requester_id,
          name: requesterProfile?.name || 'Unknown User',
          location: requesterProfile?.location || '',
          role: 'requester'
        },
        {
          user_id: helperProfile?.id || conversation.helper_id,
          name: helperProfile?.name || 'Unknown User',
          location: helperProfile?.location || '',
          role: 'helper'
        }
      ]

      const conversationWithDetails: ConversationWithDetails = {
        ...conversation,
        participants,
        help_request: conversation.help_requests || null, // Defensive null check
        unread_count: 0 // Will be updated by real-time subscription
      }

      setMessageThread({
        messages: messagesWithSenders,
        conversation: conversationWithDetails,
        loading: false,
        error: null
      })

      // Mark messages as read (V2 doesn't have recipient_id or read_at fields)
      // messages_v2 schema doesn't include read tracking - skip this for now
      // TODO: If read tracking is needed, it should be in a separate table

    } catch (error) {
      console.error('Error loading messages:', error)
      console.error('Conversation ID:', conversationId)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'N/A'
      })

      setMessageThread({
        messages: [],
        conversation: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      })
    }
  }, [supabase, userId])

  // Send message handler (V2 only has conversation_id, sender_id, content)
  const handleSendMessage = useCallback(async (content: string, messageType: 'text' | 'help_request_update' = 'text') => {
    if (!selectedConversation) return

    const conversation = messageThread.conversation
    if (!conversation) return

    try {
      // messages_v2 schema: id, conversation_id, sender_id, content, created_at, updated_at
      // No recipient_id, message_type, or help_request_id in V2
      const { error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          content
        })

      if (error) throw error

      // Update conversation's updated_at (no last_message_at in V2)
      await supabase
        .from('conversations_v2')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation)

      // Reload messages to get the new one
      await loadMessages(selectedConversation)

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [selectedConversation, messageThread.conversation, userId, supabase, loadMessages])

  // Load pending offers
  const loadPendingOffers = useCallback(async () => {
    setIsLoadingOffers(true)
    try {
      const { data, error } = await supabase.rpc('list_conversations_v2', {
        p_user_id: userId,
        p_status: 'pending'
      })

      if (error) {
        console.error('Error loading pending offers:', error)
        return
      }

      const result = data as any
      if (result.success && result.conversations) {
        setPendingOffers(result.conversations)
      }
    } catch (error) {
      console.error('Error loading pending offers:', error)
    } finally {
      setIsLoadingOffers(false)
    }
  }, [supabase, userId])

  // Accept offer handler
  const handleAcceptOffer = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch('/api/messaging/accept-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
      const result = await response.json()

      if (result.success) {
        // Reload pending offers and switch to active tab
        await loadPendingOffers()
        await loadMessages(conversationId)
        setActiveTab('active')
        setSelectedConversation(conversationId)
      } else {
        console.error('Failed to accept offer:', result.error)
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
    }
  }, [loadPendingOffers, loadMessages])

  // Reject offer handler
  const handleRejectOffer = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch('/api/messaging/reject-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
      const result = await response.json()

      if (result.success) {
        // Reload pending offers
        await loadPendingOffers()
      } else {
        console.error('Failed to reject offer:', result.error)
      }
    } catch (error) {
      console.error('Error rejecting offer:', error)
    }
  }, [loadPendingOffers])

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
    
    // On mobile, hide conversation list when selecting
    if (isMobile) {
      setShowConversationList(false)
    }
  }, [loadMessages, isMobile])

  // Handle back to conversations (mobile)
  const handleBackToConversations = useCallback(() => {
    setShowConversationList(true)
    setSelectedConversation(null)
  }, [])

  // Initial conversation selection
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      handleConversationSelect(selectedConversationId)
    }
  }, [selectedConversationId, conversations, handleConversationSelect])

  // Load pending offers on mount
  useEffect(() => {
    loadPendingOffers()
  }, [loadPendingOffers])

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !selectedConversation) return

    const subscription = supabase
      .channel(`messages:conversation:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages_v2',
        filter: `conversation_id=eq.${selectedConversation}`
      }, async (payload) => {
        // Efficiently append new message instead of reloading entire conversation
        const newMessage = payload.new as any

        // Fetch message and sender profile separately (V2 conversations_v2 FKs point to auth.users)
        const { data: message, error: msgError } = await supabase
          .from('messages_v2')
          .select('*')
          .eq('id', newMessage.id)
          .single()

        if (!msgError && message) {
          // Fetch sender profile
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
              console.debug(`Skipping duplicate message in dashboard: ${messageWithSender.id}`)
              return prev
            }

            return {
              ...prev,
              messages: [...prev.messages, messageWithSender]
            }
          })
        } else {
          // Fallback to full reload if fetch fails
          console.warn('Failed to fetch new message, reloading conversation:', msgError)
          loadMessages(selectedConversation)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [enableRealtime, selectedConversation, supabase, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageThread.messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messageThread.messages, scrollToBottom])

  const currentConversation = messageThread.conversation
  const otherParticipant = currentConversation?.participants.find(p => p.user_id !== userId)

  return (
    <div
      className={cn("h-full flex bg-background", className)}
      style={
        viewportHeight && isMobile
          ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
          : undefined
      }
    >
      {/* Conversation List Panel */}
      <div 
        className={cn(
          "flex flex-col border-r border-border bg-muted/20",
          isMobile 
            ? (showConversationList ? "w-full" : "hidden")
            : "w-80 min-w-80"
        )}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-sage" />
              Messages
            </h2>
            <Button variant="ghost" size="sm" onClick={loadPendingOffers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {conversations.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {conversations.reduce((total, conv) => total + conv.unread_count, 0)} unread messages
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-2 border-b border-border px-4" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-4 py-3 font-medium transition-colors relative text-sm",
              activeTab === 'active'
                ? "text-sage border-b-2 border-sage"
                : "text-muted-foreground hover:text-secondary"
            )}
          >
            Active ({conversations.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-4 py-3 font-medium transition-colors relative text-sm",
              activeTab === 'pending'
                ? "text-sage border-b-2 border-sage"
                : "text-muted-foreground hover:text-secondary"
            )}
          >
            Pending ({pendingOffers.length})
          </button>
        </nav>

        {/* Conditional Content */}
        {activeTab === 'active' && (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation || undefined}
            onConversationSelect={handleConversationSelect}
            className="flex-1"
          />
        )}
        {activeTab === 'pending' && (
          <div className="flex-1 overflow-auto p-4">
            <PendingOffersSection
              offers={pendingOffers}
              currentUserId={userId}
              onAccept={handleAcceptOffer}
              onReject={handleRejectOffer}
              isLoading={isLoadingOffers}
            />
          </div>
        )}
      </div>

      {/* Message Thread Panel */}
      <div
        ref={messageThreadRef}
        className={cn(
          "flex-1 flex flex-col",
          isMobile && showConversationList && "hidden"
        )}
      >
        {!selectedConversation ? (
          // No conversation selected state
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            {currentConversation && (
              <div className="border-b border-border p-4 bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleBackToConversations}
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    )}
                    
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
                      {currentConversation.help_request && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Re: {currentConversation.help_request.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentConversation.help_request && (
                      <Badge variant="outline">
                        {currentConversation.help_request.urgency}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {messageThread.loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading messages...</span>
                </div>
              ) : messageThread.error ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
                    <p className="text-sm text-destructive">{messageThread.error}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => selectedConversation && loadMessages(selectedConversation)}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {isTouchDevice ? (
                    <PullToRefresh
                      onRefresh={handleRefresh}
                      resistance={2}
                      distanceToRefresh={60}
                      refreshingContent={<RefreshIndicator />}
                    >
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messageThread.messages.map((message) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isCurrentUser={message.sender_id === userId}
                              showSenderName={true}
                            />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </PullToRefresh>
                  ) : (
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messageThread.messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isCurrentUser={message.sender_id === userId}
                            showSenderName={true}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  )}

                  {/* Typing Indicator */}
                  {selectedConversation && (
                    <TypingIndicator
                      conversationId={selectedConversation}
                      currentUserId={userId}
                      className="border-t border-border"
                    />
                  )}
                </>
              )}

              {/* Message Input */}
              {selectedConversation && !messageThread.loading && (
                <MessageInput
                  onSendMessage={handleSendMessage}
                  conversationId={selectedConversation}
                  userId={userId}
                  userName={userName}
                  disabled={messageThread.error !== null}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}