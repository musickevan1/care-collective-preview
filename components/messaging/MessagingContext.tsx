'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, ReactElement } from 'react'
import { ConversationWithDetails, MessageWithSender } from '@/lib/messaging/types'
import { createClient } from '@/lib/supabase/client'

/**
 * Message thread state interface
 */
interface MessageThread {
  messages: MessageWithSender[]
  conversation: ConversationWithDetails | null
  loading: boolean
  error: string | null
}

/**
 * Messaging context type definition
 */
interface MessagingContextType {
  // Conversation state
  conversations: ConversationWithDetails[]
  selectedConversation: string | null
  setSelectedConversation: (id: string | null) => void

  // Message thread state
  messageThread: MessageThread
  loadMessages: (conversationId: string) => Promise<void>
  handleSendMessage: (content: string, messageType?: 'text' | 'help_request_update') => Promise<void>
  setMessageThread: React.Dispatch<React.SetStateAction<MessageThread>>

  // UI state
  activeTab: 'active' | 'pending'
  setActiveTab: (tab: 'active' | 'pending') => void
  pendingOffers: any[]
  isLoadingOffers: boolean

  // Actions
  loadPendingOffers: () => Promise<void>
  handleAcceptOffer: (conversationId: string) => Promise<void>
  handleRejectOffer: (conversationId: string) => Promise<void>
  handleConversationSelect: (conversationId: string) => void

  // User context
  userId: string
}

/**
 * Create messaging context
 */
const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

/**
 * Hook to access messaging context
 * @throws {Error} If used outside MessagingProvider
 */
export function useMessagingContext(): MessagingContextType {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error('useMessagingContext must be used within MessagingProvider')
  }
  return context
}

/**
 * MessagingProvider props
 */
interface MessagingProviderProps {
  children: ReactNode
  initialConversations: ConversationWithDetails[]
  userId: string
  isMobile: boolean
  onMobileNavigate?: (showList: boolean) => void
}

/**
 * MessagingProvider - Provides messaging state and actions to child components
 */
export function MessagingProvider({
  children,
  initialConversations,
  userId,
  isMobile,
  onMobileNavigate
}: MessagingProviderProps): ReactElement {
  const [conversations] = useState<ConversationWithDetails[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageThread, setMessageThread] = useState<MessageThread>({
    messages: [],
    conversation: null,
    loading: false,
    error: null
  })
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')
  const [pendingOffers, setPendingOffers] = useState<any[]>([])
  const [isLoadingOffers, setIsLoadingOffers] = useState(false)

  const supabase = createClient()

  /**
   * Load messages for a conversation
   */
  const loadMessages = useCallback(async (conversationId: string) => {
    setMessageThread(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get conversation details
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

      // Fetch profiles for requester and helper
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', conversation.requester_id)
        .single()

      const { data: helperProfile } = await supabase
        .from('profiles')
        .select('id, name, location')
        .eq('id', conversation.helper_id)
        .single()

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      // Fetch sender profiles for all messages
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])]
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, location')
        .in('id', senderIds)

      // Map profiles to messages
      const profileMap = new Map(senderProfiles?.map(p => [p.id, p]) || [])
      const messagesWithSenders = messages?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id)
      })) || []

      // Build participants array
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
        help_request: conversation.help_requests || null,
        unread_count: 0
      }

      setMessageThread({
        messages: messagesWithSenders,
        conversation: conversationWithDetails,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessageThread({
        messages: [],
        conversation: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      })
    }
  }, [supabase])

  /**
   * Send a message
   */
  const handleSendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'help_request_update' = 'text'
  ) => {
    if (!selectedConversation) return

    try {
      const { error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          content
        })

      if (error) throw error

      // Update conversation's updated_at
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
  }, [selectedConversation, userId, supabase, loadMessages])

  /**
   * Load pending offers
   */
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

  /**
   * Accept an offer
   */
  const handleAcceptOffer = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch('/api/messaging/accept-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
      const result = await response.json()

      if (result.success) {
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

  /**
   * Reject an offer
   */
  const handleRejectOffer = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch('/api/messaging/reject-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
      const result = await response.json()

      if (result.success) {
        await loadPendingOffers()
      } else {
        console.error('Failed to reject offer:', result.error)
      }
    } catch (error) {
      console.error('Error rejecting offer:', error)
    }
  }, [loadPendingOffers])

  /**
   * Handle conversation selection
   */
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)

    // On mobile, hide conversation list
    if (isMobile && onMobileNavigate) {
      onMobileNavigate(false)
    }
  }, [loadMessages, isMobile, onMobileNavigate])

  const value: MessagingContextType = {
    // State
    conversations,
    selectedConversation,
    setSelectedConversation,
    messageThread,
    setMessageThread,
    activeTab,
    setActiveTab,
    pendingOffers,
    isLoadingOffers,
    userId,

    // Actions
    loadMessages,
    handleSendMessage,
    loadPendingOffers,
    handleAcceptOffer,
    handleRejectOffer,
    handleConversationSelect
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
