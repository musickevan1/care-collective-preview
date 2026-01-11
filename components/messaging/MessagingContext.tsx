'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, ReactElement } from 'react'
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
  hasMoreMessages: boolean
  isLoadingMore: boolean
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
  loadMoreMessages: () => Promise<void>
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
    error: null,
    hasMoreMessages: true,
    isLoadingMore: false
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

      // Get messages with pagination (limit to 50 most recent)
      const INITIAL_MESSAGE_LIMIT = 50;
      const { data: messages, error: msgError } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(INITIAL_MESSAGE_LIMIT + 1) // Fetch 1 extra to check if more exist

      if (msgError) throw msgError

      // Check if there are more messages
      const hasMoreMessages = messages && messages.length > INITIAL_MESSAGE_LIMIT;
      const limitedMessages = messages?.slice(0, INITIAL_MESSAGE_LIMIT).reverse() || []; // Reverse to oldest-first for display

      // Fetch sender profiles for all messages
      const senderIds = [...new Set(limitedMessages?.map(m => m.sender_id) || [])]
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, location')
        .in('id', senderIds)

      // Map profiles to messages
      const profileMap = new Map(senderProfiles?.map(p => [p.id, p]) || [])
      const messagesWithSenders = limitedMessages?.map(msg => ({
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
        error: null,
        hasMoreMessages,
        isLoadingMore: false
      })
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessageThread({
        messages: [],
        conversation: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
        hasMoreMessages: false,
        isLoadingMore: false
      })
    }
  }, [supabase])

  /**
   * Load more (older) messages
   */
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || messageThread.isLoadingMore || !messageThread.hasMoreMessages) {
      return;
    }

    setMessageThread(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const supabase = createClient();
      const LOAD_MORE_BATCH_SIZE = 25;
      const oldestMessage = messageThread.messages[0]; // First message is oldest

      if (!oldestMessage) {
        setMessageThread(prev => ({ ...prev, isLoadingMore: false }));
        return;
      }

      // Fetch older messages
      const { data: olderMessages, error: msgError } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(LOAD_MORE_BATCH_SIZE + 1); // Fetch 1 extra to check if more exist

      if (msgError) throw msgError;

      const hasMoreMessages = olderMessages && olderMessages.length > LOAD_MORE_BATCH_SIZE;
      const limitedMessages = olderMessages?.slice(0, LOAD_MORE_BATCH_SIZE).reverse() || [];

      if (limitedMessages.length > 0) {
        // Fetch sender profiles for new messages
        const senderIds = [...new Set(limitedMessages.map(m => m.sender_id))];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, name, location')
          .in('id', senderIds);

        const profileMap = new Map(senderProfiles?.map(p => [p.id, p]) || []);
        const messagesWithSenders = limitedMessages.map(msg => ({
          ...msg,
          sender: profileMap.get(msg.sender_id)
        }));

        setMessageThread(prev => ({
          ...prev,
          messages: [...messagesWithSenders, ...prev.messages], // Prepend older messages
          hasMoreMessages,
          isLoadingMore: false
        }));
      } else {
        setMessageThread(prev => ({
          ...prev,
          hasMoreMessages: false,
          isLoadingMore: false
        }));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setMessageThread(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [selectedConversation, messageThread.messages, messageThread.isLoadingMore, messageThread.hasMoreMessages]);

  /**
   * Send a message
   */
  const handleSendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'help_request_update' = 'text'
  ) => {
    if (!selectedConversation) {
      throw new Error('No conversation selected. Please select a conversation to send messages.')
    }

    try {
      // Use the API endpoint instead of direct insert to get proper error handling
      const response = await fetch(`/api/messaging/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          message_type: messageType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Use the user-friendly error message from the API
        const errorMessage = data.userMessage || data.error || 'Failed to send message'
        throw new Error(errorMessage)
      }

      // Reload messages to get the new one with proper formatting
      await loadMessages(selectedConversation)
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [selectedConversation, loadMessages])

  /**
   * Load pending offers
   * Transforms RPC response to match PendingOffersSection expected format
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
        // Transform data to match PendingOffersSection expected format
        const transformedOffers = result.conversations.map((conv: any) => {
          // Determine if current user is helper or requester
          const isHelper = conv.helper_id === userId
          const otherParticipant = conv.other_participant || {}

          return {
            id: conv.id,
            initial_message: conv.initial_message,
            created_at: conv.created_at,
            expires_at: conv.expires_at || conv.created_at, // Fallback if no expires_at
            requester_id: conv.requester_id,
            helper_id: conv.helper_id,
            // Build helper_profile and requester_profile from other_participant
            helper_profile: isHelper
              ? { id: userId, name: 'You', location: '' }
              : { id: otherParticipant.id, name: otherParticipant.name || 'Unknown', location: otherParticipant.location || '' },
            requester_profile: isHelper
              ? { id: otherParticipant.id, name: otherParticipant.name || 'Unknown', location: otherParticipant.location || '' }
              : { id: userId, name: 'You', location: '' },
            help_request: conv.help_request || { id: '', title: 'Conversation', category: 'other', urgency: 'normal' }
          }
        })
        setPendingOffers(transformedOffers)
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

  const value: MessagingContextType = useMemo(() => ({
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
    loadMoreMessages,
    handleSendMessage,
    loadPendingOffers,
    handleAcceptOffer,
    handleRejectOffer,
    handleConversationSelect
  }), [
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
    loadMessages,
    loadMoreMessages,
    handleSendMessage,
    loadPendingOffers,
    handleAcceptOffer,
    handleRejectOffer,
    handleConversationSelect
  ])

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
