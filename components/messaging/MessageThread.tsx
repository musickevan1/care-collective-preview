/**
 * @fileoverview Message thread component for individual conversations
 * Real-time messaging interface with Care Collective branding
 */

'use client';

import { ReactElement, useState, useEffect, useRef, useCallback } from 'react';
import { ConversationWithDetails, MessageWithSender } from '@/lib/messaging/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ConversationContextBar } from './ConversationContextBar';
import { ReportMessageDialog } from './ReportMessageDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  conversation: ConversationWithDetails;
  userId: string;
  onMessageSent: () => void;
  onMessageRead: () => void;
}

export function MessageThread({
  conversation,
  userId,
  onMessageSent,
  onMessageRead
}: MessageThreadProps): ReactElement {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reportingMessage, setReportingMessage] = useState<MessageWithSender | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string | null>(null);

  // Load messages for this conversation
  const loadMessages = useCallback(async (cursor?: string, direction: 'older' | 'newer' = 'older') => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: '50',
        direction,
        ...(cursor && { cursor })
      });

      const response = await fetch(
        `/api/messaging/conversations/${conversation.id}/messages?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      if (direction === 'newer') {
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        setMessages(direction === 'older' && cursor ? 
          [...data.messages, ...messages] : 
          data.messages
        );
      }
      
      setHasMore(data.pagination.has_more);

      // Mark messages as read if they're new to us
      const unreadMessages = data.messages.filter(
        (msg: MessageWithSender) => 
          msg.recipient.id === userId && 
          !msg.read_at &&
          msg.id !== lastMessageRef.current
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg: MessageWithSender) => markMessageAsRead(msg.id))
        );
      }

      if (data.messages.length > 0) {
        lastMessageRef.current = data.messages[data.messages.length - 1].id;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversation.id, userId, messages]);

  // Send a new message
  const sendMessage = async (content: string) => {
    if (sending || !content.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to our list
      setMessages(prev => [...prev, data.message]);
      
      // Scroll to bottom
      scrollToBottom();
      
      // Notify parent component
      onMessageSent();

    } catch (err) {
      throw err; // Let MessageInput handle the error display
    } finally {
      setSending(false);
    }
  };

  // Mark a message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/messaging/conversations/${conversation.id}/messages?messageId=${messageId}`,
        {
          method: 'PUT',
        }
      );

      if (response.ok) {
        // Update message in local state
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, read_at: new Date().toISOString(), status: 'read' }
              : msg
          )
        );
        onMessageRead();
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender.id === userId) {
        // Always scroll for our own messages
        scrollToBottom();
      } else {
        // Only auto-scroll for others' messages if we're near the bottom
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          const { scrollTop, scrollHeight, clientHeight } = scrollArea;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          if (isNearBottom) {
            scrollToBottom();
          }
        }
      }
    }
  }, [messages, userId]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  // Handle message reporting
  const handleReportMessage = async (messageId: string, reason: string, description?: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to report message');
      }

      // Hide the reported message locally (it will be reviewed by moderators)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, is_flagged: true, flagged_reason: reason }
            : msg
        )
      );

    } catch (error) {
      console.error('Failed to report message:', error);
      throw error;
    }
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (loading) {
    return <MessageThreadSkeleton />;
  }

  if (error && messages.length === 0) {
    return (
      <div className=\"flex flex-col items-center justify-center h-full p-8\">
        <div className=\"w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4\">
          <AlertCircle className=\"w-8 h-8 text-red-500\" />
        </div>
        <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">Failed to load messages</h3>
        <p className=\"text-sm text-muted-foreground mb-4\">{error}</p>
        <Button onClick={() => loadMessages()} variant=\"sage\">
          <RefreshCw className=\"w-4 h-4 mr-2\" />
          Retry
        </Button>
      </div>
    );
  }

  const isConversationBlocked = conversation.status === 'blocked';
  const otherParticipant = conversation.participants.find(p => p.user_id !== userId);

  return (
    <div className=\"flex flex-col h-full bg-gray-50\">
      {/* Conversation Context Bar */}
      <ConversationContextBar conversation={conversation} />

      {/* Safety Notice for Blocked Conversations */}
      {isConversationBlocked && (
        <Alert className=\"m-4 border-yellow-200 bg-yellow-50\">
          <Shield className=\"w-4 h-4\" />
          <AlertDescription>
            This conversation has been restricted for safety reasons. 
            New messages cannot be sent or received.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <ScrollArea className=\"flex-1 px-4\" ref={scrollAreaRef}>
        <div className=\"py-4 space-y-6\">
          {hasMore && (
            <div className=\"text-center\">
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => loadMessages(messages[0]?.created_at, 'older')}
                disabled={loading}
              >
                Load older messages
              </Button>
            </div>
          )}

          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className=\"flex items-center justify-center my-6\">
                <div className=\"bg-white px-3 py-1 rounded-full shadow-sm border text-xs font-medium text-muted-foreground\">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              <div className=\"space-y-4\">
                {dateMessages.map((message, index) => {
                  const isOwn = message.sender.id === userId;
                  const showSender = !isOwn && (
                    index === 0 ||
                    dateMessages[index - 1]?.sender.id !== message.sender.id
                  );

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showSender={showSender}
                      onReport={() => setReportingMessage(message)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className=\"flex items-center gap-2 text-sm text-muted-foreground px-4\">
              <div className=\"flex space-x-1\">
                <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" />
                <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '0.1s' }} />
                <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>
                {typingUsers.length === 1 ? 
                  `${typingUsers[0]} is typing...` : 
                  `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      {!isConversationBlocked && (
        <div className=\"border-t bg-white p-4\">
          <MessageInput
            onSendMessage={sendMessage}
            disabled={sending}
            placeholder={`Message ${otherParticipant?.name || 'participants'}...`}
            maxLength={1000}
          />
        </div>
      )}

      {/* Report Message Dialog */}
      {reportingMessage && (
        <ReportMessageDialog
          message={reportingMessage}
          onReport={handleReportMessage}
          onClose={() => setReportingMessage(null)}
        />
      )}
    </div>
  );
}

/**
 * Group messages by date for display
 */
function groupMessagesByDate(messages: MessageWithSender[]): Record<string, MessageWithSender[]> {
  const groups: Record<string, MessageWithSender[]> = {};
  
  messages.forEach(message => {
    const date = new Date(message.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return groups;
}

function MessageThreadSkeleton(): ReactElement {
  return (
    <div className=\"flex flex-col h-full bg-gray-50 animate-pulse\">
      {/* Context bar skeleton */}
      <div className=\"bg-sage-light/10 border-b p-3\">
        <div className=\"w-48 h-4 bg-gray-200 rounded mb-2\" />
        <div className=\"w-32 h-3 bg-gray-100 rounded\" />
      </div>

      {/* Messages skeleton */}
      <div className=\"flex-1 p-4 space-y-4\">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={cn(
            \"flex gap-3\",
            i % 2 === 0 ? \"justify-end\" : \"justify-start\"
          )}>
            {i % 2 !== 0 && <div className=\"w-8 h-8 bg-gray-200 rounded-full\" />}
            <div className={cn(
              \"max-w-xs p-3 rounded-2xl\",
              i % 2 === 0 ? \"bg-sage rounded-br-md\" : \"bg-white rounded-bl-md\"
            )}>
              <div className=\"w-32 h-4 bg-gray-200 rounded mb-2\" />
              <div className=\"w-24 h-3 bg-gray-100 rounded\" />
            </div>
            {i % 2 === 0 && <div className=\"w-8 h-8 bg-gray-200 rounded-full\" />}
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className=\"border-t bg-white p-4\">
        <div className=\"w-full h-10 bg-gray-100 rounded-lg\" />
      </div>
    </div>
  );
}