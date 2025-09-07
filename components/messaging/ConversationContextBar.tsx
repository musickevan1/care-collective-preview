/**
 * @fileoverview Context bar showing help request details for conversations
 * Displays relevant help request information and quick actions
 */

'use client';

import { ReactElement } from 'react';
import { ConversationWithDetails } from '@/lib/messaging/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  HelpCircle, 
  MapPin, 
  Clock, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationContextBarProps {
  conversation: ConversationWithDetails;
}

export function ConversationContextBar({ 
  conversation 
}: ConversationContextBarProps): ReactElement {
  const { help_request, participants } = conversation;

  // If no help request context, show participant info
  if (!help_request) {
    return <ParticipantContextBar participants={participants} />;
  }

  const urgencyConfig = {
    normal: { 
      color: 'bg-green-100 text-green-700 border-green-200', 
      icon: CheckCircle,
      label: 'Normal Priority'
    },
    urgent: { 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      icon: Clock,
      label: 'Urgent'
    },
    critical: { 
      color: 'bg-red-100 text-red-700 border-red-200', 
      icon: AlertCircle,
      label: 'Critical'
    }
  };

  const statusConfig = {
    open: { color: 'bg-green-100 text-green-700', label: 'Open' },
    in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed' }
  };

  const urgency = urgencyConfig[help_request.urgency as keyof typeof urgencyConfig];
  const status = statusConfig[help_request.status as keyof typeof statusConfig];
  const UrgencyIcon = urgency.icon;

  return (
    <Card className=\"bg-sage-light/10 border-sage-light/20 border-b rounded-none p-4\">
      <div className=\"flex items-start gap-4\">
        {/* Help Request Icon */}
        <div className=\"flex-shrink-0\">
          <div className=\"w-10 h-10 bg-sage-light/20 rounded-full flex items-center justify-center\">
            <HelpCircle className=\"w-5 h-5 text-sage\" />
          </div>
        </div>

        {/* Help Request Details */}
        <div className=\"flex-1 min-w-0\">
          <div className=\"flex items-start justify-between gap-4\">
            <div className=\"flex-1 min-w-0\">
              <h3 className=\"font-semibold text-secondary text-sm leading-tight mb-1\">
                About this conversation
              </h3>
              <p className=\"text-sm text-gray-700 font-medium truncate mb-2\">
                Help request: {help_request.title}
              </p>
              
              {/* Status and Urgency Badges */}
              <div className=\"flex items-center gap-2 mb-3\">
                <Badge 
                  variant=\"outline\" 
                  className={cn(\"text-xs font-medium\", status.color)}
                >
                  {status.label}
                </Badge>
                
                <Badge 
                  variant=\"outline\" 
                  className={cn(\"text-xs font-medium flex items-center gap-1\", urgency.color)}
                >
                  <UrgencyIcon className=\"w-3 h-3\" />
                  {urgency.label}
                </Badge>
                
                <Badge variant=\"outline\" className=\"text-xs capitalize bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20\">
                  {help_request.category.replace('_', ' ')}
                </Badge>
              </div>

              {/* Participants Info */}
              <div className=\"flex items-center gap-4 text-xs text-muted-foreground\">
                <div className=\"flex items-center gap-1\">
                  <User className=\"w-3 h-3\" />
                  <span>{participants.length} participants</span>
                </div>
                
                {participants[0]?.location && (
                  <div className=\"flex items-center gap-1\">
                    <MapPin className=\"w-3 h-3\" />
                    <span className=\"truncate max-w-32\">{participants[0].location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant=\"outline\"
              size=\"sm\"
              onClick={() => {
                window.open(`/requests/${help_request.id}`, '_blank');
              }}
              className=\"flex-shrink-0 text-xs h-8 px-3 border-sage/30 text-sage hover:bg-sage/5\"
            >
              <ExternalLink className=\"w-3 h-3 mr-1\" />
              View Request
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Notice for Critical Requests */}
      {help_request.urgency === 'critical' && (
        <div className=\"mt-3 p-2 bg-red-50 border border-red-200 rounded-md\">
          <div className=\"flex items-center gap-2 text-xs text-red-700\">
            <AlertCircle className=\"w-4 h-4 flex-shrink-0\" />
            <div>
              <p className=\"font-medium\">Critical help request</p>
              <p className=\"text-red-600\">
                This person may need urgent assistance. If this is an emergency, 
                please also contact local emergency services.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Context bar for conversations without help request context
 */
function ParticipantContextBar({ 
  participants 
}: { 
  participants: Array<{ user_id: string; name: string; location?: string; role: string }> 
}): ReactElement {
  return (
    <Card className=\"bg-dusty-rose-light/10 border-dusty-rose-light/20 border-b rounded-none p-4\">
      <div className=\"flex items-center gap-4\">
        {/* Conversation Icon */}
        <div className=\"flex-shrink-0\">
          <div className=\"w-10 h-10 bg-dusty-rose-light/20 rounded-full flex items-center justify-center\">
            <User className=\"w-5 h-5 text-dusty-rose\" />
          </div>
        </div>

        {/* Participant Info */}
        <div className=\"flex-1\">
          <h3 className=\"font-semibold text-secondary text-sm mb-1\">
            Community Conversation
          </h3>
          <div className=\"flex items-center gap-4 text-xs text-muted-foreground\">
            <div className=\"flex items-center gap-1\">
              <User className=\"w-3 h-3\" />
              <span>{participants.length} participants</span>
            </div>
            
            {participants.length === 2 && participants[1]?.location && (
              <div className=\"flex items-center gap-1\">
                <MapPin className=\"w-3 h-3\" />
                <span className=\"truncate max-w-32\">{participants[1].location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Direct Message Badge */}
        <Badge variant=\"outline\" className=\"text-xs bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20\">
          Direct Message
        </Badge>
      </div>
    </Card>
  );
}