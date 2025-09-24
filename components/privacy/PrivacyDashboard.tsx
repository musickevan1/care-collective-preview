'use client'

import { useState, useEffect } from 'react'
import { ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Shield,
  Lock,
  Eye,
  Download,
  Trash2,
  Clock,
  Settings,
  Users,
  Bell,
  FileText,
  AlertTriangle,
  CheckCircle,
  History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  userPrivacyControls,
  getUserPrivacySettings,
  updateUserPrivacySettings,
  revokeContactSharing,
  requestDataExport,
  type UserPrivacySettings,
  type DataExportRequest
} from '@/lib/privacy/user-controls'
import { getContactEncryptionStatus } from '@/lib/security/contact-encryption'
import { captureError, addBreadcrumb } from '@/lib/error-tracking'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PrivacyDashboardProps {
  userId: string
  className?: string
}

interface ContactSharingHistoryItem {
  id: string
  shared_with_user_id: string
  help_request_id: string
  fields_shared: string[]
  sharing_purpose: string
  status: 'active' | 'revoked' | 'expired'
  shared_at: string
  expires_at?: string
  revoked_at?: string
  help_requests: {
    id: string
    title: string
    category: string
    urgency: string
    status: string
  }
  profiles: {
    id: string
    name: string
    location?: string
  }
}

export function PrivacyDashboard({ userId, className }: PrivacyDashboardProps): ReactElement {
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null)
  const [sharingHistory, setSharingHistory] = useState<ContactSharingHistoryItem[]>([])
  const [exportRequests, setExportRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadPrivacyData()
  }, [userId])

  const loadPrivacyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load privacy settings
      const settings = await getUserPrivacySettings(userId)
      setPrivacySettings(settings)

      // Load sharing history
      const history = await userPrivacyControls.getContactSharingHistory(userId, { limit: 20 })
      setSharingHistory(history as ContactSharingHistoryItem[])

      // Load export requests
      const exports = await userPrivacyControls.getDataExportRequests(userId)
      setExportRequests(exports)

      // Get encryption status
      const encryption = getContactEncryptionStatus()
      setEncryptionStatus(encryption)

      addBreadcrumb({
        message: 'Privacy dashboard loaded',
        category: 'privacy_dashboard',
        level: 'info'
      })

    } catch (err) {
      console.error('Error loading privacy data:', err)
      captureError(err as Error, {
        component: 'PrivacyDashboard',
        action: 'loadPrivacyData',
        userId,
        severity: 'medium'
      })
      setError('Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSettings = async (updates: Partial<UserPrivacySettings>) => {
    if (!privacySettings) return

    try {
      setSaving(true)
      const updatedSettings = await updateUserPrivacySettings(userId, updates)
      setPrivacySettings(updatedSettings)

      addBreadcrumb({
        message: 'Privacy settings updated',
        category: 'privacy_dashboard',
        level: 'info',
        data: { updates: Object.keys(updates) }
      })

    } catch (err) {
      captureError(err as Error, {
        component: 'PrivacyDashboard',
        action: 'handleUpdateSettings',
        userId,
        severity: 'medium'
      })
      setError('Failed to update privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRevokeSharing = async (exchangeId: string) => {
    try {
      const success = await revokeContactSharing(userId, exchangeId, 'User request from privacy dashboard')
      if (success) {
        // Reload sharing history
        const history = await userPrivacyControls.getContactSharingHistory(userId, { limit: 20 })
        setSharingHistory(history as ContactSharingHistoryItem[])
      } else {
        setError('Failed to revoke contact sharing')
      }
    } catch (err) {
      captureError(err as Error, {
        component: 'PrivacyDashboard',
        action: 'handleRevokeSharing',
        userId,
        severity: 'medium'
      })
      setError('Failed to revoke contact sharing')
    }
  }

  const handleRequestDataExport = async (exportType: DataExportRequest['request_type']) => {
    try {
      const exportId = await requestDataExport(userId, {
        request_type: exportType,
        export_format: 'json'
      })

      // Reload export requests
      const exports = await userPrivacyControls.getDataExportRequests(userId)
      setExportRequests(exports)

      addBreadcrumb({
        message: 'Data export requested',
        category: 'privacy_dashboard',
        level: 'info',
        data: { exportType, exportId }
      })

    } catch (err) {
      captureError(err as Error, {
        component: 'PrivacyDashboard',
        action: 'handleRequestDataExport',
        userId,
        severity: 'medium'
      })
      setError('Failed to request data export')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setError('Please type "DELETE_MY_ACCOUNT" to confirm')
      return
    }

    try {
      const success = await userPrivacyControls.deleteUserAccount(userId, deleteConfirmation)
      if (success) {
        // In production, this would redirect to a confirmation page
        alert('Account deletion initiated. You will receive an email confirmation.')
      } else {
        setError('Failed to delete account')
      }
    } catch (err) {
      captureError(err as Error, {
        component: 'PrivacyDashboard',
        action: 'handleDeleteAccount',
        userId,
        severity: 'critical'
      })
      setError('Failed to delete account')
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Privacy Dashboard Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPrivacyData} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (!privacySettings) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Privacy Settings Found</h3>
        <p className="text-muted-foreground">Unable to load your privacy settings.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage">Privacy & Security Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your privacy settings and control how your data is shared
          </p>
        </div>
        <div className="flex items-center gap-2">
          {encryptionStatus?.supported && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Lock className="h-3 w-3 mr-1" />
              Encryption Enabled
            </Badge>
          )}
          <Badge variant="outline">
            GDPR Compliant
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-sage" />
              <div>
                <p className="text-sm text-muted-foreground">Active Sharing</p>
                <p className="text-2xl font-bold">
                  {sharingHistory.filter(h => h.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Data Retention</p>
                <p className="text-2xl font-bold">
                  {privacySettings.auto_delete_exchanges_after_days} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Export Requests</p>
                <p className="text-2xl font-bold">
                  {exportRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Sharing History
          </TabsTrigger>
          <TabsTrigger value="exports">
            <Download className="h-4 w-4 mr-2" />
            Data Exports
          </TabsTrigger>
          <TabsTrigger value="account">
            <Trash2 className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Privacy Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Default Contact Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Default Contact Sharing
                </CardTitle>
                <CardDescription>
                  Control what contact information is shared by default
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-email">Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Share your email for digital communication
                    </p>
                  </div>
                  <Switch
                    id="share-email"
                    checked={privacySettings.default_contact_sharing.email}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        default_contact_sharing: {
                          ...privacySettings.default_contact_sharing,
                          email: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-phone">Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Share your phone for direct calls/texts
                    </p>
                  </div>
                  <Switch
                    id="share-phone"
                    checked={privacySettings.default_contact_sharing.phone}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        default_contact_sharing: {
                          ...privacySettings.default_contact_sharing,
                          phone: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-location">Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Share your general area for coordination
                    </p>
                  </div>
                  <Switch
                    id="share-location"
                    checked={privacySettings.default_contact_sharing.location}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        default_contact_sharing: {
                          ...privacySettings.default_contact_sharing,
                          location: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preferred Contact Method</Label>
                  <Select
                    value={privacySettings.default_contact_sharing.preferred_method}
                    onValueChange={(value: 'email' | 'phone') =>
                      handleUpdateSettings({
                        default_contact_sharing: {
                          ...privacySettings.default_contact_sharing,
                          preferred_method: value
                        }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Data Retention
                </CardTitle>
                <CardDescription>
                  Control how long your contact information is stored
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Auto-delete contact exchanges after:</Label>
                  <div className="px-3">
                    <Slider
                      value={[privacySettings.auto_delete_exchanges_after_days]}
                      onValueChange={([value]) =>
                        handleUpdateSettings({
                          auto_delete_exchanges_after_days: value
                        })
                      }
                      max={365}
                      min={7}
                      step={7}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>7 days</span>
                      <span className="font-medium">
                        {privacySettings.auto_delete_exchanges_after_days} days
                      </span>
                      <span>365 days</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergency-override">Emergency Override</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing all contact info for critical requests
                    </p>
                  </div>
                  <Switch
                    id="emergency-override"
                    checked={privacySettings.allow_emergency_override}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        allow_emergency_override: checked
                      })
                    }
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control what privacy-related notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-requests">Contact Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when someone requests your contact info
                    </p>
                  </div>
                  <Switch
                    id="notify-requests"
                    checked={privacySettings.notification_preferences.contact_requests}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        notification_preferences: {
                          ...privacySettings.notification_preferences,
                          contact_requests: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-updates">Privacy Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about privacy policy changes
                    </p>
                  </div>
                  <Switch
                    id="notify-updates"
                    checked={privacySettings.notification_preferences.privacy_updates}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        notification_preferences: {
                          ...privacySettings.notification_preferences,
                          privacy_updates: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-retention">Data Retention Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Remind before auto-deleting shared data
                    </p>
                  </div>
                  <Switch
                    id="notify-retention"
                    checked={privacySettings.notification_preferences.data_retention_reminders}
                    onCheckedChange={(checked) =>
                      handleUpdateSettings({
                        notification_preferences: {
                          ...privacySettings.notification_preferences,
                          data_retention_reminders: checked
                        }
                      })
                    }
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Status
                </CardTitle>
                <CardDescription>
                  Your current security and privacy protection level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contact Encryption</span>
                  <Badge variant={encryptionStatus?.supported ? "default" : "secondary"}>
                    {encryptionStatus?.supported ? "Enabled" : "Not Available"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">GDPR Compliance</span>
                  <Badge variant={privacySettings.gdpr_consent_given ? "default" : "destructive"}>
                    {privacySettings.gdpr_consent_given ? "Compliant" : "Consent Required"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Retention Policy</span>
                  <Badge variant="default">
                    {privacySettings.auto_delete_exchanges_after_days} days
                  </Badge>
                </div>

                {encryptionStatus && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Your data is protected with {encryptionStatus.algorithm} encryption</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sharing History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Contact Sharing History</CardTitle>
              <CardDescription>
                View and manage all instances where you've shared contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Sharing History</h3>
                  <p className="text-muted-foreground">You haven't shared contact information yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharingHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{item.help_requests.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Shared with {item.profiles.name} • {item.help_requests.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === 'active' ? 'default' :
                              item.status === 'revoked' ? 'destructive' : 'secondary'
                            }
                          >
                            {item.status}
                          </Badge>
                          {item.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSharing(item.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Fields: {item.fields_shared.join(', ')}</span>
                        <span>Shared: {new Date(item.shared_at).toLocaleDateString()}</span>
                        {item.expires_at && (
                          <span>Expires: {new Date(item.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exports Tab */}
        <TabsContent value="exports">
          <div className="space-y-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Request Data Export</CardTitle>
                <CardDescription>
                  Export your data in compliance with GDPR and privacy regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleRequestDataExport('full_export')}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <h4 className="font-medium">Full Data Export</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete export of all your data
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleRequestDataExport('contact_data_only')}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <h4 className="font-medium">Contact Data Only</h4>
                      <p className="text-sm text-muted-foreground">
                        Export only contact sharing data
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleRequestDataExport('privacy_audit')}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <Shield className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <h4 className="font-medium">Privacy Audit</h4>
                      <p className="text-sm text-muted-foreground">
                        Privacy settings and audit trail
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleRequestDataExport('sharing_history')}
                    className="h-auto p-4 flex flex-col items-start"
                  >
                    <History className="h-6 w-6 mb-2" />
                    <div className="text-left">
                      <h4 className="font-medium">Sharing History</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete contact sharing history
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Requests History */}
            <Card>
              <CardHeader>
                <CardTitle>Export Requests</CardTitle>
                <CardDescription>
                  Your recent data export requests and downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Export Requests</h3>
                    <p className="text-muted-foreground">You haven't requested any data exports yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exportRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium capitalize">
                              {request.request_type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Requested: {new Date(request.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                request.status === 'completed' ? 'default' :
                                request.status === 'failed' ? 'destructive' :
                                request.status === 'expired' ? 'secondary' : 'outline'
                              }
                            >
                              {request.status}
                            </Badge>
                            {request.status === 'completed' && request.export_file_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={request.export_file_url} download>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            {/* GDPR Consent */}
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-700">GDPR Consent</CardTitle>
                <CardDescription>
                  Your consent status for data processing under GDPR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {privacySettings.gdpr_consent_given ? "Consent Given" : "Consent Required"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {privacySettings.gdpr_consent_date
                        ? `Given on ${new Date(privacySettings.gdpr_consent_date).toLocaleDateString()}`
                        : "Required for using contact exchange features"
                      }
                    </p>
                  </div>
                  <Badge variant={privacySettings.gdpr_consent_given ? "default" : "destructive"}>
                    {privacySettings.gdpr_consent_given ? "Compliant" : "Action Required"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account Deletion */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data (GDPR Right to be Forgotten)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700">
                        <p className="font-medium">This action cannot be undone</p>
                        <ul className="mt-1 space-y-1">
                          <li>• Your account will be permanently deleted</li>
                          <li>• All contact sharing data will be removed</li>
                          <li>• Your help requests will be anonymized</li>
                          <li>• This action complies with GDPR Right to be Forgotten</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account and all associated data.
                          Type "DELETE_MY_ACCOUNT" to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <input
                          type="text"
                          placeholder="Type DELETE_MY_ACCOUNT"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}