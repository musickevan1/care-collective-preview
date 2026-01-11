'use client'

import { useState, useEffect, ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Bell, Mail, Clock, Users, Save, Loader2 } from 'lucide-react'

interface MessagingPreferences {
  user_id: string
  can_receive_from: 'nobody' | 'anyone' | 'help_connections'
  auto_accept_help_requests: boolean
  email_notifications: boolean
  push_notifications: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

export default function NotificationsSettingsPage(): ReactElement {
  const [preferences, setPreferences] = useState<MessagingPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/messaging/preferences')
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences)
      setQuietHoursEnabled(!!data.preferences?.quiet_hours_start)
    } catch (err) {
      setError('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const updateData = {
        can_receive_from: preferences.can_receive_from,
        auto_accept_help_requests: preferences.auto_accept_help_requests,
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        quiet_hours_start: quietHoursEnabled ? preferences.quiet_hours_start : null,
        quiet_hours_end: quietHoursEnabled ? preferences.quiet_hours_end : null,
      }

      const response = await fetch('/api/messaging/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save preferences')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = <K extends keyof MessagingPreferences>(
    key: K,
    value: MessagingPreferences[K]
  ) => {
    if (!preferences) return
    setPreferences({ ...preferences, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Preferences</h2>
        <p className="text-muted-foreground">
          Control how and when you receive notifications
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Preferences saved successfully!
        </div>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences?.email_notifications ?? true}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences?.push_notifications ?? true}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Message Settings
          </CardTitle>
          <CardDescription>
            Control who can message you and how requests are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="can-receive-from">Who can message me</Label>
            <Select
              value={preferences?.can_receive_from ?? 'help_connections'}
              onValueChange={(value) => updatePreference('can_receive_from', value as MessagingPreferences['can_receive_from'])}
            >
              <SelectTrigger id="can-receive-from" className="min-h-[44px]">
                <SelectValue placeholder="Select who can message you" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anyone">Anyone in the community</SelectItem>
                <SelectItem value="help_connections">Only people I&apos;m connected with through help requests</SelectItem>
                <SelectItem value="nobody">Nobody (disable messages)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-accept" className="font-medium">
                Auto-accept help offers
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically accept offers on your help requests
              </p>
            </div>
            <Switch
              id="auto-accept"
              checked={preferences?.auto_accept_help_requests ?? true}
              onCheckedChange={(checked) => updatePreference('auto_accept_help_requests', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don&apos;t want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours" className="font-medium">
                Enable Quiet Hours
              </Label>
              <p className="text-sm text-muted-foreground">
                Pause notifications during set times
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences?.quiet_hours_start || '22:00'}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences?.quiet_hours_end || '08:00'}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="min-h-[44px]"
          variant="sage"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
