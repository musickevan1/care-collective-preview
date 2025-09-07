/**
 * @fileoverview Main messaging dashboard component
 * Mobile-first design following Care Collective design system
 */

'use client';

import { ReactElement, useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessagingPreferencesDialog } from './MessagingPreferencesDialog';
import { ConversationWithDetails } from '@/lib/messaging/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle, Settings, Users, HelpCircle } from 'lucide-react';

interface MessagingDashboardProps {
  initialConversations?: ConversationWithDetails[];
  userId: string;
}

export function MessagingDashboard({ 
  initialConversations = [], 
  userId 
}: MessagingDashboardProps): ReactElement {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile-first: show conversation list by default, thread when selected
  const [view, setView] = useState<'list' | 'thread'>('list');

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Calculate total unread messages
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setView('thread');
  };

  // Handle back to conversation list (mobile)
  const handleBackToList = () => {
    setSelectedConversationId(null);
    setView('list');
  };

  // Refresh conversations
  const refreshConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/messaging/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Handle new message sent
  const handleMessageSent = (conversationId: string) => {
    // Update the conversation's last_message_at timestamp
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, last_message_at: new Date().toISOString() }
          : conv
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    );
  };

  // Handle message read
  const handleMessageRead = (conversationId: string) => {
    // Decrease unread count for this conversation
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, unread_count: Math.max(0, conv.unread_count - 1) }
          : conv
      )
    );
  };

  // Auto-refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(refreshConversations, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && conversations.length === 0) {
    return <MessagingDashboardSkeleton />;
  }

  return (
    <div className=\"flex flex-col h-screen bg-background\">
      {/* Header */}
      <header className=\"bg-sage text-white p-4 shadow-sm\">
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-3\">
            {view === 'thread' && (
              <Button 
                variant=\"ghost\" 
                size=\"sm\"
                onClick={handleBackToList}
                className=\"text-white hover:bg-sage-dark lg:hidden\"
              >
                ←
              </Button>
            )}
            <MessageCircle className=\"w-6 h-6\" />
            <div>
              <h1 className=\"text-lg font-semibold\">
                {view === 'thread' && selectedConversation
                  ? (selectedConversation.help_request?.title || 'Conversation')
                  : 'Messages'
                }
              </h1>
              <p className=\"text-sage-light text-sm\">
                {view === 'thread' && selectedConversation
                  ? `${selectedConversation.participants.length} participants`
                  : `${conversations.length} conversations${totalUnreadCount > 0 ? ` • ${totalUnreadCount} unread` : ''}`
                }
              </p>
            </div>
          </div>
          
          <div className=\"flex items-center gap-2\">
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => setShowPreferences(true)}
              className=\"text-white hover:bg-sage-dark\"
              aria-label=\"Messaging preferences\"
            >
              <Settings className=\"w-5 h-5\" />
            </Button>
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={refreshConversations}
              className=\"text-white hover:bg-sage-dark\"
              aria-label=\"Refresh conversations\"
              disabled={loading}
            >
              ↻
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className=\"flex-1 overflow-hidden\">
        {/* Desktop: Side-by-side layout */}
        <div className=\"hidden lg:flex h-full\">
          {/* Conversation List Sidebar */}
          <div className=\"w-1/3 border-r border-gray-200 bg-white\">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onRefresh={refreshConversations}
              loading={loading}
              error={error}
            />
          </div>
          
          {/* Message Thread Area */}
          <div className=\"flex-1 bg-gray-50\">
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                userId={userId}
                onMessageSent={() => handleMessageSent(selectedConversation.id)}
                onMessageRead={() => handleMessageRead(selectedConversation.id)}
              />
            ) : (
              <EmptyMessageState />
            )}
          </div>
        </div>

        {/* Mobile: Single view at a time */}
        <div className=\"lg:hidden h-full\">
          {view === 'list' ? (
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onRefresh={refreshConversations}
              loading={loading}
              error={error}
            />
          ) : selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              userId={userId}
              onMessageSent={() => handleMessageSent(selectedConversation.id)}
              onMessageRead={() => handleMessageRead(selectedConversation.id)}
            />
          ) : (
            <EmptyMessageState />
          )}
        </div>
      </div>

      {/* Messaging Preferences Dialog */}
      {showPreferences && (
        <MessagingPreferencesDialog
          userId={userId}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}

/**
 * Empty state component when no conversation is selected
 */
function EmptyMessageState(): ReactElement {
  return (
    <div className=\"flex items-center justify-center h-full p-8\">
      <Card className=\"max-w-md mx-auto text-center\">
        <CardHeader>
          <div className=\"w-16 h-16 bg-sage-light/20 rounded-full flex items-center justify-center mx-auto mb-4\">
            <Users className=\"w-8 h-8 text-sage\" />
          </div>
          <h3 className=\"text-lg font-semibold text-secondary\">
            Select a conversation
          </h3>
        </CardHeader>
        <CardContent>
          <p className=\"text-muted-foreground mb-4\">
            Choose a conversation from the list to start messaging with community members.
          </p>
          <div className=\"flex items-center justify-center gap-4 text-sm text-muted-foreground\">
            <div className=\"flex items-center gap-2\">
              <MessageCircle className=\"w-4 h-4\" />
              <span>Direct messages</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <HelpCircle className=\"w-4 h-4\" />
              <span>Help coordination</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for the messaging dashboard
 */
function MessagingDashboardSkeleton(): ReactElement {
  return (
    <div className=\"flex flex-col h-screen bg-background animate-pulse\">
      {/* Header Skeleton */}
      <div className=\"bg-sage p-4\">
        <div className=\"flex items-center gap-3\">
          <div className=\"w-6 h-6 bg-sage-dark rounded\" />
          <div>
            <div className=\"w-24 h-5 bg-sage-dark rounded mb-2\" />
            <div className=\"w-32 h-3 bg-sage-light rounded\" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className=\"flex-1 p-4\">
        <div className=\"space-y-4\">
          {[1, 2, 3].map(i => (
            <div key={i} className=\"flex items-center gap-3 p-3 border rounded-lg\">
              <div className=\"w-12 h-12 bg-gray-200 rounded-full\" />
              <div className=\"flex-1\">
                <div className=\"w-24 h-4 bg-gray-200 rounded mb-2\" />
                <div className=\"w-32 h-3 bg-gray-100 rounded\" />
              </div>
              <div className=\"w-12 h-3 bg-gray-100 rounded\" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}