/**
 * @fileoverview Moderation queue component for admin interface
 * Displays reported messages and allows moderation actions
 */

'use client';

import { ReactElement, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Flag,
  Eye,
  EyeOff,
  UserX,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Calendar,
  User,
  HelpCircle,
  Loader2,
  Shield,
  Ban
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModerationQueueItem {
  id: string;
  message: {
    id: string;
    content: string;
    conversation_id: string;
    sender_id: string;
    created_at: string;
    sender: {
      id: string;
      name: string;
      location?: string;
    };
    conversations?: {
      help_requests?: {
        id: string;
        title: string;
        category: string;
      };
    };
  };
  report: {
    reason: string;
    description?: string;
    created_at: string;
  };
  reporter: {
    id: string;
    name: string;
  };
  context: {
    conversation_id: string;
    help_request_title?: string;
  };
}

interface ModerationQueueProps {
  items: ModerationQueueItem[];
  onItemProcessed: () => void;
}

export function ModerationQueue({ items, onItemProcessed }: ModerationQueueProps): ReactElement {
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonLabels: Record<string, string> = {
    'spam': 'Spam',
    'harassment': 'Harassment',
    'inappropriate': 'Inappropriate Content',
    'scam': 'Scam/Fraud',
    'other': 'Other'
  };

  const reasonColors: Record<string, string> = {
    'spam': 'bg-blue-100 text-blue-700 border-blue-200',
    'harassment': 'bg-red-100 text-red-700 border-red-200',
    'inappropriate': 'bg-orange-100 text-orange-700 border-orange-200',
    'scam': 'bg-purple-100 text-purple-700 border-purple-200',
    'other': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className=\"p-8 text-center\">
          <div className=\"w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4\">
            <CheckCircle className=\"w-8 h-8 text-green-600\" />
          </div>
          <h3 className=\"text-lg font-semibold mb-2\">All clear!</h3>
          <p className=\"text-muted-foreground\">
            No pending message reports to review at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <Flag className=\"w-5 h-5 text-red-500\" />
            Moderation Queue ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className=\"p-0\">
          <div className=\"divide-y divide-gray-200\">
            {items.map(item => (
              <ModerationQueueItemCard
                key={item.id}
                item={item}
                onReview={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <ModerationReviewDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onProcessed={() => {
            setSelectedItem(null);
            onItemProcessed();
          }}
        />
      )}
    </>
  );
}

interface ModerationQueueItemCardProps {
  item: ModerationQueueItem;
  onReview: () => void;
}

function ModerationQueueItemCard({ item, onReview }: ModerationQueueItemCardProps): ReactElement {
  const reasonLabels: Record<string, string> = {
    'spam': 'Spam',
    'harassment': 'Harassment',
    'inappropriate': 'Inappropriate Content',
    'scam': 'Scam/Fraud',
    'other': 'Other'
  };

  const reasonColors: Record<string, string> = {
    'spam': 'bg-blue-100 text-blue-700 border-blue-200',
    'harassment': 'bg-red-100 text-red-700 border-red-200',
    'inappropriate': 'bg-orange-100 text-orange-700 border-orange-200',
    'scam': 'bg-purple-100 text-purple-700 border-purple-200',
    'other': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const timeAgo = formatDistanceToNow(new Date(item.report.created_at), { addSuffix: true });

  return (
    <div className=\"p-4 hover:bg-gray-50 transition-colors\">
      <div className=\"flex items-start gap-4\">
        {/* Reporter Avatar */}
        <Avatar name={item.reporter.name} size=\"sm\" />

        {/* Report Details */}
        <div className=\"flex-1 min-w-0\">
          <div className=\"flex items-center gap-2 mb-2\">
            <Badge 
              variant=\"outline\" 
              className={cn('text-xs', reasonColors[item.report.reason] || reasonColors.other)}
            >
              {reasonLabels[item.report.reason] || 'Other'}
            </Badge>
            <span className=\"text-sm text-muted-foreground\">•</span>
            <span className=\"text-sm text-muted-foreground\">
              Reported {timeAgo} by {item.reporter.name}
            </span>
          </div>

          {/* Message Preview */}
          <div className=\"bg-gray-50 border rounded-lg p-3 mb-3\">
            <div className=\"flex items-center gap-2 mb-2 text-sm text-gray-600\">
              <Avatar name={item.message.sender.name} size=\"sm\" />
              <span className=\"font-medium\">{item.message.sender.name}</span>
              {item.message.sender.location && (
                <>
                  <span>•</span>
                  <span>{item.message.sender.location}</span>
                </>
              )}
            </div>
            <p className=\"text-sm text-gray-800 line-clamp-3 font-mono bg-white p-2 rounded border\">
              {item.message.content}
            </p>
          </div>

          {/* Context Information */}
          <div className=\"flex items-center gap-4 text-xs text-muted-foreground mb-3\">
            <div className=\"flex items-center gap-1\">
              <MessageCircle className=\"w-3 h-3\" />
              <span>Conversation ID: {item.context.conversation_id.slice(0, 8)}...</span>
            </div>
            {item.context.help_request_title && (
              <div className=\"flex items-center gap-1\">
                <HelpCircle className=\"w-3 h-3\" />
                <span>Re: {item.context.help_request_title}</span>
              </div>
            )}
            <div className=\"flex items-center gap-1\">
              <Calendar className=\"w-3 h-3\" />
              <span>
                {formatDistanceToNow(new Date(item.message.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Report Description */}
          {item.report.description && (
            <div className=\"bg-yellow-50 border border-yellow-200 rounded p-2 mb-3\">
              <p className=\"text-sm text-yellow-800\">
                <strong>Reporter notes:</strong> {item.report.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className=\"flex-shrink-0\">
          <Button onClick={onReview} size=\"sm\" variant=\"outline\">
            <Eye className=\"w-4 h-4 mr-2\" />
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ModerationReviewDialogProps {
  item: ModerationQueueItem;
  onClose: () => void;
  onProcessed: () => void;
}

function ModerationReviewDialog({ item, onClose, onProcessed }: ModerationReviewDialogProps): ReactElement {
  const [action, setAction] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!action || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/moderation/${item.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process moderation item');
      }

      onProcessed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process item');
    } finally {
      setProcessing(false);
    }
  };

  const actionOptions = [
    {
      value: 'dismiss',
      label: 'Dismiss Report',
      description: 'Report is invalid or content is acceptable',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      value: 'hide_message',
      label: 'Hide Message',
      description: 'Hide the message but take no user action',
      icon: EyeOff,
      color: 'text-blue-600'
    },
    {
      value: 'warn_user',
      label: 'Warn User',
      description: 'Send warning to the message sender',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      value: 'restrict_user',
      label: 'Restrict User',
      description: 'Temporarily limit user messaging privileges',
      icon: UserX,
      color: 'text-orange-600'
    },
    {
      value: 'ban_user',
      label: 'Ban User',
      description: 'Permanently ban user from messaging',
      icon: Ban,
      color: 'text-red-600'
    }
  ];

  const selectedActionOption = actionOptions.find(opt => opt.value === action);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className=\"max-w-3xl max-h-[90vh] overflow-y-auto\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center gap-2\">
            <Shield className=\"w-5 h-5 text-blue-500\" />
            Review Reported Message
          </DialogTitle>
          <DialogDescription>
            Review the reported message and take appropriate moderation action.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-6\">
          {/* Report Summary */}
          <div className=\"bg-red-50 border border-red-200 rounded-lg p-4\">
            <h4 className=\"font-medium text-red-800 mb-2\">Report Details</h4>
            <div className=\"space-y-2 text-sm\">
              <div>
                <strong>Reason:</strong> {item.report.reason}
              </div>
              <div>
                <strong>Reported by:</strong> {item.reporter.name}
              </div>
              <div>
                <strong>Reported:</strong> {formatDistanceToNow(new Date(item.report.created_at), { addSuffix: true })}
              </div>
              {item.report.description && (
                <div>
                  <strong>Description:</strong> {item.report.description}
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className=\"space-y-3\">
            <h4 className=\"font-medium\">Reported Message</h4>
            <div className=\"bg-gray-50 border rounded-lg p-4\">
              <div className=\"flex items-center gap-3 mb-3\">
                <Avatar name={item.message.sender.name} />
                <div>
                  <p className=\"font-medium\">{item.message.sender.name}</p>
                  <p className=\"text-sm text-muted-foreground\">
                    {formatDistanceToNow(new Date(item.message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className=\"bg-white border rounded p-3\">
                <p className=\"font-mono text-sm whitespace-pre-wrap\">
                  {item.message.content}
                </p>
              </div>
            </div>
          </div>

          {/* Context */}
          {item.context.help_request_title && (
            <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
              <h4 className=\"font-medium text-blue-800 mb-2\">Context</h4>
              <p className=\"text-sm text-blue-700\">
                This message was sent in a conversation about the help request: 
                <strong> {item.context.help_request_title}</strong>
              </p>
            </div>
          )}

          {/* Action Selection */}
          <div className=\"space-y-3\">
            <Label htmlFor=\"action\">Moderation Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder=\"Choose an action...\" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className=\"flex items-center gap-2\">
                        <IconComponent className={`w-4 h-4 ${option.color}`} />
                        <div className=\"flex flex-col\">
                          <span className=\"font-medium\">{option.label}</span>
                          <span className=\"text-xs text-gray-500\">
                            {option.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedActionOption && (
              <div className={`p-3 border rounded-lg ${
                selectedActionOption.value === 'dismiss' ? 'bg-green-50 border-green-200' :
                selectedActionOption.value === 'ban_user' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className=\"flex items-center gap-2 mb-1\">
                  <selectedActionOption.icon className={`w-4 h-4 ${selectedActionOption.color}`} />
                  <span className=\"font-medium\">{selectedActionOption.label}</span>
                </div>
                <p className=\"text-sm text-gray-600\">{selectedActionOption.description}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className=\"space-y-2\">
            <Label htmlFor=\"notes\">Moderation Notes (Optional)</Label>
            <Textarea
              id=\"notes\"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder=\"Add any additional notes about this moderation decision...\"
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant=\"destructive\">
              <AlertTriangle className=\"w-4 h-4\" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className=\"flex gap-2\">
          <Button
            variant=\"outline\"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcess}
            disabled={!action || processing}
            className=\"bg-blue-600 hover:bg-blue-700 text-white\"
          >
            {processing ? (
              <>
                <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                Processing...
              </>
            ) : (
              'Apply Action'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}