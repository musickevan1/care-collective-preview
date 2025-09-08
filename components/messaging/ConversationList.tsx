/**
 * @fileoverview Conversation list component
 * Shows user's conversations with unread indicators and help request context
 */

'use client';

import { ReactElement } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, HelpCircle, Clock, User } from 'lucide-react';
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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  currentUserId
}: ConversationListProps): ReactElement {
  
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-secondary mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground text-center">
          Start helping your community by responding to help requests
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-2 p-2">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), { 
            addSuffix: true 
          });
          
          return (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation.id)}
              className={cn(
                "p-4 rounded-lg cursor-pointer transition-colors border",
                isSelected 
                  ? "bg-sage/10 border-sage/20" 
                  : "bg-background border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar 
                  name={conversation.other_participant.name}
                  size="md"
                  className="bg-dusty-rose text-white"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-secondary truncate">
                      {conversation.other_participant.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center p-0">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                  
                  {/* Help Request Context */}
                  {conversation.help_request && (
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-3 h-3 text-sage" />
                      <span className="text-xs text-muted-foreground truncate">
                        {conversation.help_request.title}
                      </span>
                      <Badge 
                        variant={conversation.help_request.urgency === 'critical' ? 'destructive' : 
                               conversation.help_request.urgency === 'urgent' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {conversation.help_request.urgency}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Last Message Preview */}
                  {conversation.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.sender_id === currentUserId ? 'You: ' : ''}
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}