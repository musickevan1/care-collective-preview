/**
 * @fileoverview Main messaging dashboard component
 * Integrated with platform navigation and enhanced functionality
 */

'use client';

import { ReactElement, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { 
  MessageCircle, 
  Search, 
  Filter,
  Plus,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  help_request_id?: string;
  last_message_at: string;
  unread_count: number;
  other_participant: {
    id: string;
    name: string;
    location?: string;
  };
  help_request?: {
    id: string;
    title: string;
    category: string;
    urgency: 'normal' | 'urgent' | 'critical';
    status: 'open' | 'in_progress' | 'closed';
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
}

interface MessagingDashboardProps {
  initialConversations?: Conversation[];
  userId: string;
  enableRealtime?: boolean;
  selectedConversationId?: string;
}

export function MessagingDashboard({
  initialConversations = [],
  userId,
  enableRealtime = true,
  selectedConversationId
}: MessagingDashboardProps): ReactElement {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    selectedConversationId || null
  );
  const [filterType, setFilterType] = useState<'all' | 'help_requests' | 'direct'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Filter conversations based on type
  const filteredConversations = conversations.filter(conv => {
    switch (filterType) {
      case 'help_requests':
        return conv.help_request_id;
      case 'direct':
        return !conv.help_request_id;
      default:
        return true;
    }
  });

  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    
    // Update URL without refresh
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversationId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedConversation(null);
    
    // Clear conversation from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-hidden flex">
        {/* Conversations List */}
        <div className={cn(
          "w-full border-r border-border bg-background",
          "md:w-1/3",
          selectedConversation ? "hidden md:block" : "block"
        )}>
          {/* Conversations Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary">Conversations</h2>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/requests">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Link>
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-secondary/5 rounded-lg">
              {[
                { key: 'all', label: 'All', icon: MessageCircle },
                { key: 'help_requests', label: 'Help Requests', icon: Users },
                { key: 'direct', label: 'Direct', icon: Users }
              ].map((filter) => {
                const Icon = filter.icon;
                const isActive = filterType === filter.key;
                const count = filter.key === 'all' ? conversations.length : 
                            filter.key === 'help_requests' ? conversations.filter(c => c.help_request_id).length :
                            conversations.filter(c => !c.help_request_id).length;

                return (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key as typeof filterType)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-background text-secondary shadow-sm" 
                        : "text-muted-foreground hover:text-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6">
                {conversations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-secondary mb-2">
                          No conversations yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start helping your community by responding to help requests
                        </p>
                        <Button asChild>
                          <Link href="/requests">
                            <Search className="w-4 h-4 mr-2" />
                            Browse Help Requests
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No {filterType === 'all' ? '' : filterType.replace('_', ' ')} conversations
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ConversationList
                conversations={filteredConversations}
                selectedConversationId={selectedConversation}
                onConversationSelect={handleConversationSelect}
                currentUserId={userId}
              />
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={cn(
          "flex-1 flex flex-col",
          selectedConversation ? "block" : "hidden md:flex"
        )}>
          {selectedConversation ? (
            <MessageThread
              conversationId={selectedConversation}
              currentUserId={userId}
              onBack={handleBackToList}
              enableRealtime={enableRealtime}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-sage" />
                </div>
                <h3 className="text-lg font-semibold text-secondary mb-2">
                  Select a conversation
                </h3>
                <p className="text-muted-foreground mb-6">
                  Choose a conversation from the list to begin chatting with community members, 
                  or start a new one by offering help on a request.
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/requests">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Help Requests
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/requests/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Help Request
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}