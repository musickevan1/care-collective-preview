/**
 * @fileoverview Dialog for managing user messaging preferences
 * Privacy controls and notification settings
 */

'use client';

import { ReactElement, useState, useEffect } from 'react';
import { MessagingPreferences } from '@/lib/messaging/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Bell, Clock, Loader2, Check } from 'lucide-react';

interface MessagingPreferencesDialogProps {
  userId: string;
  onClose: () => void;
}

export function MessagingPreferencesDialog({
  userId,
  onClose
}: MessagingPreferencesDialogProps): ReactElement {
  const [preferences, setPreferences] = useState<MessagingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/messaging/preferences');
        if (!response.ok) {
          throw new Error('Failed to load preferences');
        }
        const data = await response.json();
        setPreferences(data.preferences);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    if (!preferences || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/messaging/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          can_receive_from: preferences.can_receive_from,
          auto_accept_help_requests: preferences.auto_accept_help_requests,
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
          quiet_hours_start: preferences.quiet_hours_start || undefined,
          quiet_hours_end: preferences.quiet_hours_end || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      setSaved(true);
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = (updates: Partial<MessagingPreferences>) => {
    if (!preferences) return;
    setPreferences({ ...preferences, ...updates });
    setSaved(false);
    setError(null);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className=\"flex items-center justify-center py-8\">
            <Loader2 className=\"w-8 h-8 animate-spin text-sage\" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!preferences) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className=\"text-center py-8\">
            <p className=\"text-red-600\">Failed to load messaging preferences</p>
            <Button onClick={onClose} className=\"mt-4\">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className=\"max-w-2xl max-h-[90vh] overflow-y-auto\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center gap-2 text-xl\">
            <Settings className=\"w-5 h-5 text-sage\" />
            Messaging Preferences
          </DialogTitle>
          <DialogDescription>
            Control who can message you and customize your notification settings.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-6\">
          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2 text-lg\">
                <Shield className=\"w-4 h-4 text-sage\" />
                Privacy & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"can_receive_from\" className=\"font-medium\">
                  Who can send you messages?
                </Label>
                <Select
                  value={preferences.can_receive_from}
                  onValueChange={(value: 'anyone' | 'help_connections' | 'nobody') =>
                    updatePreferences({ can_receive_from: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"anyone\">
                      <div className=\"flex flex-col\">
                        <span className=\"font-medium\">Anyone in the community</span>
                        <span className=\"text-sm text-gray-500\">
                          All community members can start conversations with you
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value=\"help_connections\">
                      <div className=\"flex flex-col\">
                        <span className=\"font-medium\">Help request connections only</span>
                        <span className=\"text-sm text-gray-500\">
                          Only people you've helped or who want to help you
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value=\"nobody\">
                      <div className=\"flex flex-col\">
                        <span className=\"font-medium\">Nobody (disable messaging)</span>
                        <span className=\"text-sm text-gray-500\">
                          You won't receive any new messages
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className=\"flex items-center justify-between\">
                <div className=\"space-y-0.5\">
                  <Label className=\"font-medium\">Auto-accept help request messages</Label>
                  <p className=\"text-sm text-muted-foreground\">
                    Automatically allow messages from people offering help on your requests
                  </p>
                </div>
                <Switch
                  checked={preferences.auto_accept_help_requests}
                  onCheckedChange={(checked) =>
                    updatePreferences({ auto_accept_help_requests: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2 text-lg\">
                <Bell className=\"w-4 h-4 text-sage\" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"flex items-center justify-between\">
                <div className=\"space-y-0.5\">
                  <Label className=\"font-medium\">Email notifications</Label>
                  <p className=\"text-sm text-muted-foreground\">
                    Receive email notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    updatePreferences({ email_notifications: checked })
                  }
                />
              </div>

              <div className=\"flex items-center justify-between\">
                <div className=\"space-y-0.5\">
                  <Label className=\"font-medium\">Push notifications</Label>
                  <p className=\"text-sm text-muted-foreground\">
                    Receive browser notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) =>
                    updatePreferences({ push_notifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2 text-lg\">
                <Clock className=\"w-4 h-4 text-sage\" />
                Quiet Hours
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <p className=\"text-sm text-muted-foreground\">
                Set hours when you don't want to receive notifications (you'll still receive messages)
              </p>
              
              <div className=\"grid grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"quiet_start\">Start time</Label>
                  <Input
                    id=\"quiet_start\"
                    type=\"time\"
                    value={preferences.quiet_hours_start || ''}
                    onChange={(e) =>
                      updatePreferences({ quiet_hours_start: e.target.value || undefined })
                    }
                  />
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"quiet_end\">End time</Label>
                  <Input
                    id=\"quiet_end\"
                    type=\"time\"
                    value={preferences.quiet_hours_end || ''}
                    onChange={(e) =>
                      updatePreferences({ quiet_hours_end: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
              
              {preferences.quiet_hours_start && preferences.quiet_hours_end && (
                <div className=\"p-3 bg-sage-light/10 rounded-md text-sm text-sage-dark\">
                  Quiet hours: {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant=\"destructive\">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {saved && (
            <Alert className=\"border-green-200 bg-green-50\">
              <Check className=\"w-4 h-4 text-green-600\" />
              <AlertDescription className=\"text-green-700\">
                Preferences saved successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className=\"flex gap-2\">
          <Button
            variant=\"outline\"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className=\"bg-sage hover:bg-sage-dark\"
          >
            {saving ? (
              <>
                <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className=\"w-4 h-4 mr-2\" />
                Saved
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}