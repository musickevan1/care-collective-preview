'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ReactElement } from 'react'
import { ConversationWithDetails, MessageWithSender } from '@/lib/messaging/types'
import { ConversationList } from './ConversationList'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { PresenceIndicator, usePresenceStatus } from './PresenceIndicator'
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
  const [showConversationList, setShowConversationList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setMessageThread(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner (
            user_id,
            profiles (
              id,
              name,
              location
            )
          ),
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

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            name,
            location
          ),
          recipient:profiles!recipient_id (
            id,
            name,
            location
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      // Transform conversation data
      const conversationWithDetails: ConversationWithDetails = {
        ...conversation,
        participants: conversation.conversation_participants.map((cp: any) => ({
          user_id: cp.user_id,
          name: cp.profiles.name,
          location: cp.profiles.location,
          role: cp.role || 'member'
        })),
        help_request: conversation.help_requests,
        unread_count: 0 // Will be updated by real-time subscription
      }

      setMessageThread({
        messages: messages || [],
        conversation: conversationWithDetails,
        loading: false,
        error: null
      })

      // Mark messages as read
      if (messages?.length) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('recipient_id', userId)
          .is('read_at', null)
      }

    } catch (error) {
      console.error('Error loading messages:', error)
      setMessageThread({
        messages: [],
        conversation: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      })
    }
  }, [supabase, userId])

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, messageType: 'text' | 'help_request_update' = 'text') => {
    if (!selectedConversation) return

    const conversation = messageThread.conversation
    if (!conversation) return

    // Find recipient (the other participant)
    const recipient = conversation.participants.find(p => p.user_id !== userId)
    if (!recipient) throw new Error('No recipient found')

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          recipient_id: recipient.user_id,
          content,
          message_type: messageType,
          help_request_id: conversation.help_request?.id
        })

      if (error) throw error

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation)

      // Reload messages to get the new one
      await loadMessages(selectedConversation)

    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [selectedConversation, messageThread.conversation, userId, supabase, loadMessages])

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

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !selectedConversation) return

    const subscription = supabase
      .channel(`messages:conversation:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, async (payload) => {
        // Efficiently append new message instead of reloading entire conversation
        const newMessage = payload.new as any

        // Fetch full message with sender/recipient profiles
        const { data: messageWithProfiles, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(id, name, location),
            recipient:profiles!messages_recipient_id_fkey(id, name, location)
          `)
          .eq('id', newMessage.id)
          .single()

        if (!error && messageWithProfiles) {
          setMessageThread(prev => {
            // Deduplicate: check if message already exists
            const exists = prev.messages.some(msg => msg.id === messageWithProfiles.id)
            if (exists) {
              console.debug(`Skipping duplicate message in dashboard: ${messageWithProfiles.id}`)
              return prev
            }

            return {
              ...prev,
              messages: [...prev.messages, messageWithProfiles]
            }
          })
        } else {
          // Fallback to full reload if fetch fails
          console.warn('Failed to fetch new message, reloading conversation:', error)
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
    <div className={cn("h-full flex bg-background", className)}>
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
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {conversations.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {conversations.reduce((total, conv) => total + conv.unread_count, 0)} unread messages
            </p>
          )}
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation || undefined}
          onConversationSelect={handleConversationSelect}
          className="flex-1"
        />
      </div>

      {/* Message Thread Panel */}
      <div 
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