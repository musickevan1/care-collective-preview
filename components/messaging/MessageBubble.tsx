/**
 * @fileoverview Message bubble component with Care Collective styling
 * Individual message display with sender info, timestamps, and actions
 */

'use client';

import { ReactElement, useState } from 'react';
import { MessageWithSender } from '@/lib/messaging/types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
import { MoreHorizontal, Flag, Copy, Check, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showSender?: boolean;
  onReport: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSender = false,
  onReport
}: MessageBubbleProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const [showFullTime, setShowFullTime] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
  const fullTime = format(new Date(message.created_at), 'MMM d, yyyy \'at\' h:mm a');

  // System messages (like help request updates) get special styling
  if (message.message_type === 'system' || message.message_type === 'help_request_update') {
    return <SystemMessageBubble message={message} />;
  }

  // Handle moderated/flagged messages
  if (message.is_flagged && message.moderation_status === 'hidden') {
    return <ModeratedMessageBubble message={message} isOwn={isOwn} />;
  }

  return (
    <div className={cn(
      \"flex gap-3 group\",
      isOwn ? \"justify-end\" : \"justify-start\"
    )}>
      {/* Sender Avatar (left side for received messages) */}
      {!isOwn && showSender && (
        <Avatar 
          name={message.sender.name}
          className=\"w-8 h-8 bg-dusty-rose text-white text-sm\"
        />
      )}

      {/* Message Content */}
      <div className={cn(
        \"flex flex-col max-w-xs sm:max-w-md\",
        isOwn ? \"items-end\" : \"items-start\"
      )}>
        {/* Sender Name (for received messages) */}
        {!isOwn && showSender && (
          <div className=\"flex items-center gap-2 mb-1 px-1\">
            <span className=\"text-sm font-medium text-secondary\">
              {message.sender.name}
            </span>
            {message.sender.location && (
              <span className=\"text-xs text-muted-foreground\">
                {message.sender.location}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          \"relative px-4 py-2 rounded-2xl shadow-sm border transition-colors\",
          isOwn
            ? \"bg-sage text-white rounded-br-md border-sage\"
            : \"bg-white text-secondary rounded-bl-md border-gray-200 hover:border-gray-300\"
        )}>
          {/* Message Content */}
          <p className=\"text-sm leading-relaxed whitespace-pre-wrap break-words\">
            {message.content}
          </p>

          {/* Message Actions (visible on hover) */}
          <div className={cn(
            \"absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity\",
            isOwn ? \"-left-10\" : \"-right-10\"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  className=\"h-6 w-6 p-0 rounded-full bg-white shadow-md border-gray-200 hover:bg-gray-50\"
                >
                  <MoreHorizontal className=\"w-3 h-3 text-gray-500\" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? \"end\" : \"start\"} className=\"w-48\">
                <DropdownMenuItem onClick={handleCopyMessage} className=\"text-sm\">
                  {copied ? (
                    <>
                      <Check className=\"w-4 h-4 mr-2 text-green-500\" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className=\"w-4 h-4 mr-2\" />
                      Copy message
                    </>
                  )}
                </DropdownMenuItem>
                {!isOwn && (
                  <DropdownMenuItem onClick={onReport} className=\"text-sm text-red-600 hover:text-red-700\">
                    <Flag className=\"w-4 h-4 mr-2\" />
                    Report message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Message Metadata */}
        <div className={cn(
          \"flex items-center gap-2 mt-1 px-1\",
          isOwn ? \"flex-row-reverse\" : \"flex-row\"
        )}>
          {/* Timestamp */}
          <button
            onClick={() => setShowFullTime(!showFullTime)}
            className=\"text-xs text-muted-foreground hover:text-gray-600 transition-colors\"
            title={fullTime}
          >
            {showFullTime ? fullTime : timeAgo}
          </button>

          {/* Message Status (for sent messages) */}
          {isOwn && (
            <div className=\"flex items-center gap-1\">
              {message.status === 'sent' && (
                <Clock className=\"w-3 h-3 text-gray-400\" title=\"Sent\" />
              )}
              {message.status === 'delivered' && (
                <Check className=\"w-3 h-3 text-gray-500\" title=\"Delivered\" />
              )}
              {message.status === 'read' && (
                <CheckCheck className=\"w-3 h-3 text-sage\" title=\"Read\" />
              )}
              {message.status === 'failed' && (
                <AlertTriangle className=\"w-3 h-3 text-red-500\" title=\"Failed to send\" />
              )}
            </div>
          )}

          {/* Flagged Indicator */}
          {message.is_flagged && (
            <Badge variant=\"outline\" className=\"text-xs border-yellow-500 text-yellow-700 bg-yellow-50\">
              Under review
            </Badge>
          )}
        </div>
      </div>

      {/* Sender Avatar (right side for sent messages) */}
      {isOwn && showSender && (
        <Avatar 
          name={message.sender.name}
          className=\"w-8 h-8 bg-sage text-white text-sm\"
        />
      )}
    </div>
  );
}

/**
 * System message component for help request updates and notifications
 */
function SystemMessageBubble({ message }: { message: MessageWithSender }): ReactElement {
  return (
    <div className=\"flex justify-center my-4\">
      <div className=\"bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-sm text-center\">
        <p className=\"text-sm text-blue-800 font-medium\">
          {message.content}
        </p>
        <p className=\"text-xs text-blue-600 mt-1\">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

/**
 * Moderated message component for hidden/removed content
 */
function ModeratedMessageBubble({ 
  message, 
  isOwn 
}: { 
  message: MessageWithSender; 
  isOwn: boolean; 
}): ReactElement {
  return (
    <div className={cn(
      \"flex gap-3\",
      isOwn ? \"justify-end\" : \"justify-start\"
    )}>
      <div className={cn(
        \"flex flex-col max-w-xs sm:max-w-md\",
        isOwn ? \"items-end\" : \"items-start\"
      )}>
        <div className={cn(
          \"px-4 py-2 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50\",
          isOwn ? \"rounded-br-md\" : \"rounded-bl-md\"
        )}>
          <div className=\"flex items-center gap-2 text-gray-500\">
            <Flag className=\"w-4 h-4\" />
            <p className=\"text-sm italic\">
              This message has been hidden by moderators
            </p>
          </div>
          {message.flagged_reason && (
            <p className=\"text-xs text-gray-400 mt-1\">
              Reason: {message.flagged_reason}
            </p>
          )}
        </div>
        <div className={cn(
          \"flex items-center gap-2 mt-1 px-1\",
          isOwn ? \"flex-row-reverse\" : \"flex-row\"
        )}>
          <span className=\"text-xs text-muted-foreground\">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}