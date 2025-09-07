/**
 * @fileoverview Conversation list component
 * Shows user's conversations with unread indicators and help request context
 */

'use client';

import { ReactElement, useState } from 'react';
import { ConversationWithDetails } from '@/lib/messaging/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, HelpCircle, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onRefresh,
  loading,
  error
}: ConversationListProps): ReactElement {
  const [filter, setFilter] = useState<'all' | 'help_requests' | 'unread'>('all');

  // Filter conversations based on selected filter
  const filteredConversations = conversations.filter(conversation => {
    switch (filter) {
      case 'help_requests':
        return conversation.help_request !== null;
      case 'unread':
        return conversation.unread_count > 0;
      default:
        return true;
    }
  });

  const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);
  const helpRequestCount = conversations.filter(conv => conv.help_request).length;

  if (error) {
    return <ConversationListError error={error} onRetry={onRefresh} />;
  }

  if (conversations.length === 0 && !loading) {
    return <EmptyConversationList />;
  }

  return (
    <div className=\"flex flex-col h-full bg-white\">
      {/* Filter Tabs */}
      <div className=\"border-b border-gray-200 p-4\">
        <div className=\"flex gap-2\">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            icon={<MessageCircle className=\"w-4 h-4\" />}
            label=\"All\"
            count={conversations.length}
          />
          <FilterButton
            active={filter === 'help_requests'}
            onClick={() => setFilter('help_requests')}
            icon={<HelpCircle className=\"w-4 h-4\" />}
            label=\"Help\"
            count={helpRequestCount}
          />
          <FilterButton
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
            icon={<AlertCircle className=\"w-4 h-4\" />}
            label=\"Unread\"
            count={unreadCount}
            variant={unreadCount > 0 ? 'default' : 'outline'}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className=\"flex-1 overflow-y-auto\">
        {loading && conversations.length === 0 ? (
          <ConversationListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <div className=\"p-8 text-center text-muted-foreground\">
            <div className=\"w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4\">
              <MessageCircle className=\"w-8 h-8 text-gray-400\" />
            </div>
            <p>
              {filter === 'all' 
                ? 'No conversations yet'
                : filter === 'help_requests' 
                  ? 'No help request conversations'
                  : 'No unread messages'
              }
            </p>
          </div>
        ) : (
          <div className=\"divide-y divide-gray-100\">
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactElement;
  label: string;
  count: number;
  variant?: 'default' | 'outline';
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
  variant = 'outline'
}: FilterButtonProps): ReactElement {
  return (
    <Button
      variant={active ? 'sage' : variant}
      size=\"sm\"
      onClick={onClick}
      className={cn(
        \"flex items-center gap-2 text-xs font-medium transition-colors\",
        active && \"bg-sage text-white\"
      )}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <Badge 
          variant={active ? \"secondary\" : \"outline\"} 
          className={cn(
            \"ml-1 text-xs min-w-[1.25rem] h-5 px-1\",
            active ? \"bg-white text-sage\" : \"\"
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  );
}

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  onClick
}: ConversationItemProps): ReactElement {
  // Get the other participant(s) for display
  const otherParticipants = conversation.participants.filter(p => p.user_id !== conversation.created_by);
  const primaryParticipant = otherParticipants[0] || conversation.participants[0];

  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), {
    addSuffix: false
  });

  return (
    <div
      className={cn(
        \"p-4 hover:bg-sage-light/10 cursor-pointer border-l-4 transition-all\",
        isSelected ? \"bg-sage-light/20 border-sage\" : \"border-transparent\"
      )}
      onClick={onClick}
      role=\"button\"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Conversation with ${primaryParticipant?.name}${conversation.help_request ? ` about ${conversation.help_request.title}` : ''}`}
    >
      <div className=\"flex items-start gap-3\">
        {/* Avatar */}
        <div className=\"relative\">
          <Avatar 
            name={primaryParticipant?.name || 'Unknown'}
            className=\"w-12 h-12 bg-dusty-rose text-white\"
          />
          {conversation.unread_count > 0 && (
            <div className=\"absolute -top-1 -right-1 w-5 h-5 bg-dusty-rose rounded-full flex items-center justify-center\">
              <span className=\"text-xs font-bold text-white\">
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className=\"flex-1 min-w-0\">
          {/* Header */}
          <div className=\"flex items-center justify-between mb-1\">
            <div className=\"flex items-center gap-2 min-w-0 flex-1\">
              <h3 className={cn(
                \"font-medium truncate\",
                conversation.unread_count > 0 ? \"text-secondary\" : \"text-gray-700\"
              )}>
                {primaryParticipant?.name || 'Unknown User'}
              </h3>
              {conversation.help_request && (
                <div className=\"flex items-center gap-1 text-sage\">
                  <HelpCircle className=\"w-3 h-3\" />
                  <Badge variant=\"outline\" className=\"text-xs border-sage text-sage\">
                    {conversation.help_request.category}
                  </Badge>
                </div>
              )}
            </div>
            <div className=\"flex items-center gap-1 text-xs text-muted-foreground ml-2\">
              <Clock className=\"w-3 h-3\" />
              <time dateTime={conversation.last_message_at}>
                {timeAgo}
              </time>
            </div>
          </div>

          {/* Help Request Context */}
          {conversation.help_request && (
            <div className=\"mb-2\">
              <p className=\"text-sm text-sage font-medium truncate\">
                Re: {conversation.help_request.title}
              </p>
              <div className=\"flex items-center gap-3 text-xs text-muted-foreground mt-1\">
                <div className=\"flex items-center gap-1\">
                  <span className={cn(
                    \"w-2 h-2 rounded-full\",
                    conversation.help_request.urgency === 'critical' ? 'bg-red-500' :
                    conversation.help_request.urgency === 'urgent' ? 'bg-yellow-500' :
                    'bg-green-500'
                  )} />
                  <span>{conversation.help_request.urgency}</span>
                </div>
                <span>•</span>
                <span className={cn(
                  \"px-1.5 py-0.5 rounded text-xs\",
                  conversation.help_request.status === 'open' ? 'bg-green-100 text-green-700' :
                  conversation.help_request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {conversation.help_request.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Last Message Preview */}
          {conversation.last_message && (
            <div className=\"flex items-center gap-2\">
              <p className={cn(
                \"text-sm truncate flex-1\",
                conversation.unread_count > 0 ? \"text-gray-900 font-medium\" : \"text-gray-600\"
              )}>
                {conversation.last_message.sender_name === primaryParticipant?.name ? '' : 'You: '}
                {conversation.last_message.content}
              </p>
            </div>
          )}

          {/* Participant Info */}
          {primaryParticipant?.location && (
            <div className=\"flex items-center gap-1 mt-2 text-xs text-muted-foreground\">
              <MapPin className=\"w-3 h-3\" />
              <span>{primaryParticipant.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationListError({ error, onRetry }: { error: string; onRetry: () => void }): ReactElement {
  return (
    <div className=\"flex flex-col items-center justify-center h-full p-8 text-center\">
      <div className=\"w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4\">
        <AlertCircle className=\"w-8 h-8 text-red-500\" />
      </div>
      <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">
        Failed to load conversations
      </h3>
      <p className=\"text-sm text-muted-foreground mb-4\">
        {error}
      </p>
      <Button onClick={onRetry} variant=\"sage\" size=\"sm\">
        Try again
      </Button>
    </div>
  );
}

function EmptyConversationList(): ReactElement {
  return (
    <div className=\"flex flex-col items-center justify-center h-full p-8 text-center\">
      <div className=\"w-16 h-16 bg-sage-light/20 rounded-full flex items-center justify-center mb-4\">
        <MessageCircle className=\"w-8 h-8 text-sage\" />
      </div>
      <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">
        No conversations yet
      </h3>
      <p className=\"text-sm text-muted-foreground mb-4 max-w-sm\">
        When you offer help or receive messages, your conversations will appear here.
      </p>
      <div className=\"flex flex-col gap-2 text-xs text-muted-foreground\">
        <div className=\"flex items-center gap-2\">
          <HelpCircle className=\"w-4 h-4\" />
          <span>Browse help requests to start conversations</span>
        </div>
        <div className=\"flex items-center gap-2\">
          <User className=\"w-4 h-4\" />
          <span>Connect with community members safely</span>
        </div>
      </div>
    </div>
  );
}

function ConversationListSkeleton(): ReactElement {
  return (
    <div className=\"divide-y divide-gray-100 animate-pulse\">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className=\"p-4 flex items-start gap-3\">
          <div className=\"w-12 h-12 bg-gray-200 rounded-full\" />
          <div className=\"flex-1 space-y-2\">
            <div className=\"flex items-center justify-between\">
              <div className=\"w-32 h-4 bg-gray-200 rounded\" />
              <div className=\"w-12 h-3 bg-gray-100 rounded\" />
            </div>
            <div className=\"w-48 h-3 bg-gray-100 rounded\" />
            <div className=\"w-64 h-3 bg-gray-100 rounded\" />
          </div>
        </div>
      ))}
    </div>
  );
}