/**
 * @fileoverview Dialog for reporting inappropriate messages
 * Community safety feature with categorized reporting options
 */

'use client';

import { ReactElement, useState } from 'react';
import { MessageWithSender } from '@/lib/messaging/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

interface ReportMessageDialogProps {
  message: MessageWithSender;
  onReport: (messageId: string, reason: string, description?: string) => Promise<void>;
  onClose: () => void;
}

const reportReasons = [
  { value: 'spam', label: 'Spam or unwanted messages', description: 'Repetitive, commercial, or irrelevant content' },
  { value: 'harassment', label: 'Harassment or bullying', description: 'Threatening, abusive, or intimidating behavior' },
  { value: 'inappropriate', label: 'Inappropriate content', description: 'Sexual, violent, or offensive material' },
  { value: 'scam', label: 'Suspected scam or fraud', description: 'Attempts to deceive or steal information/money' },
  { value: 'other', label: 'Other (please describe)', description: 'Other violations of community guidelines' }
];

export function ReportMessageDialog({
  message,
  onReport,
  onClose
}: ReportMessageDialogProps): ReactElement {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReason = reportReasons.find(r => r.value === reason);
  const requiresDescription = reason === 'other';
  const canSubmit = reason && (!requiresDescription || description.trim());

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await onReport(
        message.id, 
        reason, 
        description.trim() || undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className=\"max-w-md\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center gap-2 text-lg\">
            <Shield className=\"w-5 h-5 text-red-500\" />
            Report Message
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
            All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-4\">
          {/* Message Preview */}
          <div className=\"p-3 bg-gray-50 border rounded-lg\">
            <div className=\"flex items-center gap-2 mb-2 text-sm text-gray-600\">
              <span className=\"font-medium\">{message.sender.name}</span>
              <span>•</span>
              <span>{new Date(message.created_at).toLocaleDateString()}</span>
            </div>
            <p className=\"text-sm text-gray-800 line-clamp-3\">
              {message.content}
            </p>
          </div>

          {/* Report Reason Selection */}
          <div className=\"space-y-2\">
            <label className=\"text-sm font-medium text-gray-700\">
              Reason for reporting *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder=\"Select a reason...\" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map(reasonOption => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    <div className=\"flex flex-col\">
                      <span className=\"font-medium\">{reasonOption.label}</span>
                      <span className=\"text-xs text-gray-500\">
                        {reasonOption.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReason && (
              <p className=\"text-xs text-gray-500 mt-1\">
                {selectedReason.description}
              </p>
            )}
          </div>

          {/* Additional Details */}
          <div className=\"space-y-2\">
            <label className=\"text-sm font-medium text-gray-700\">
              Additional details {requiresDescription && '*'}
              <span className=\"font-normal text-gray-500\">
                {requiresDescription ? ' (required)' : ' (optional)'}
              </span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                requiresDescription
                  ? \"Please describe the issue...\"
                  : \"Any additional context that might help our review...\"
              }
              className=\"resize-none\"
              rows={3}
              maxLength={500}
            />
            <div className=\"flex justify-between text-xs text-gray-500\">
              <span>Help our moderators understand the issue better</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant=\"destructive\">
              <AlertCircle className=\"w-4 h-4\" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Community Guidelines Notice */}
          <Alert>
            <Shield className=\"w-4 h-4\" />
            <AlertDescription className=\"text-sm\">
              <strong>Community Guidelines:</strong> Care Collective is built on trust and mutual respect. 
              We take all reports seriously and will investigate promptly. False reports may result in 
              restrictions on your account.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className=\"flex gap-2\">
          <Button
            variant=\"outline\"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className=\"bg-red-600 hover:bg-red-700 text-white\"
          >
            {submitting ? (
              <>
                <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                Submitting...
              </>
            ) : (
              <>
                <Shield className=\"w-4 h-4 mr-2\" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}