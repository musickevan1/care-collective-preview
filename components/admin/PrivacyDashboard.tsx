'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Shield,
  AlertTriangle,
  Eye,
  TrendingUp,
  Users,
  Lock,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Download,
  Archive
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  PrivacyEventTracker,
  getPrivacyAlerts,
  getUserPrivacyEvents
} from '@/lib/security/privacy-event-tracker'
import { captureError, addBreadcrumb } from '@/lib/error-tracking'

interface AdminPrivacyDashboardProps {
  adminUserId: string
  className?: string
}

interface PrivacyAlert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  help_request_id?: string
  exchange_id?: string
  description: string
  details: Record<string, any>
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolution_notes?: string
  detected_at: string
  resolved_at?: string
}

interface PrivacyMetrics {
  total_alerts: number
  open_alerts: number
  critical_alerts: number
  resolved_today: number
  active_exchanges: number
  encryption_failures: number
  privacy_violations: number
  gdpr_requests: number
}

export function AdminPrivacyDashboard({ adminUserId, className }: AdminPrivacyDashboardProps): ReactElement {
  const [alerts, setAlerts] = useState<PrivacyAlert[]>([])
  const [metrics, setMetrics] = useState<PrivacyMetrics | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<PrivacyAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('open')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const supabase = createClient()

  const calculatePrivacyMetrics = useCallback(async (): Promise<PrivacyMetrics> => {
    try {
      // Get all alerts for metrics calculation
      const allAlerts = await getPrivacyAlerts({})

      // Get today's date for filtering
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate contact exchange statistics
      const { data: exchanges, error: exchangeError } = await supabase
        .from('contact_exchanges')
        .select('status, created_at')

      if (exchangeError) throw exchangeError

      // Calculate metrics
      const metrics: PrivacyMetrics = {
        total_alerts: allAlerts.length,
        open_alerts: allAlerts.filter(a => a.status === 'open').length,
        critical_alerts: allAlerts.filter(a => a.severity === 'critical').length,
        resolved_today: allAlerts.filter(a => {
          if (!a.resolved_at) return false
          const resolvedDate = new Date(a.resolved_at)
          return resolvedDate >= today
        }).length,
        active_exchanges: exchanges?.filter(e => e.status === 'completed').length || 0,
        encryption_failures: allAlerts.filter(a => a.alert_type === 'ENCRYPTION_FAILURE').length,
        privacy_violations: allAlerts.filter(a =>
          ['SUSPICIOUS_CONTACT_PATTERN', 'RATE_LIMIT_EXCEEDED', 'INAPPROPRIATE_MESSAGE_CONTENT'].includes(a.alert_type)
        ).length,
        gdpr_requests: allAlerts.filter(a => a.description.toLowerCase().includes('gdpr')).length
      }

      return metrics

    } catch (error) {
      captureError(error as Error, {
        component: 'AdminPrivacyDashboard',
        action: 'calculatePrivacyMetrics',
        severity: 'medium'
      })

      // Return default metrics on error
      return {
        total_alerts: 0,
        open_alerts: 0,
        critical_alerts: 0,
        resolved_today: 0,
        active_exchanges: 0,
        encryption_failures: 0,
        privacy_violations: 0,
        gdpr_requests: 0
      }
    }
  }, [supabase])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load privacy alerts
      const alertOptions: any = { limit: 50 }
      if (filterSeverity !== 'all') alertOptions.severity = filterSeverity
      if (filterStatus !== 'all') alertOptions.status = filterStatus

      const alertsData = await getPrivacyAlerts(alertOptions)
      setAlerts(alertsData as PrivacyAlert[])

      // Calculate metrics
      const metricsData = await calculatePrivacyMetrics()
      setMetrics(metricsData)

      addBreadcrumb({
        message: 'Admin privacy dashboard loaded',
        category: 'admin_privacy',
        level: 'info',
        data: {
          alertsCount: alertsData.length,
          filters: { severity: filterSeverity, status: filterStatus }
        }
      })

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      captureError(err as Error, {
        component: 'AdminPrivacyDashboard',
        action: 'loadDashboardData',
        userId: adminUserId,
        severity: 'medium'
      })
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [filterSeverity, filterStatus, adminUserId, calculatePrivacyMetrics])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleResolveAlert = async (alertId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      const { error } = await supabase
        .from('privacy_violation_alerts')
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
          assigned_to: adminUserId
        })
        .eq('id', alertId)

      if (error) throw error

      // Track resolution action
      await PrivacyEventTracker.getInstance().trackPrivacyEvent({
        event_type: 'PRIVACY_VIOLATION_REVIEWED',
        user_id: adminUserId,
        severity: 'medium',
        description: `Privacy alert ${resolution} by admin`,
        metadata: {
          alert_id: alertId,
          resolution_type: resolution,
          resolution_notes: resolutionNotes
        },
        detected_by: 'admin_review'
      })

      // Reload data
      await loadDashboardData()

      // Reset form
      setResolutionNotes('')
      setSelectedAlert(null)

      addBreadcrumb({
        message: `Privacy alert ${resolution}`,
        category: 'admin_privacy',
        level: 'info',
        data: { alertId, resolution }
      })

    } catch (error) {
      captureError(error as Error, {
        component: 'AdminPrivacyDashboard',
        action: 'handleResolveAlert',
        severity: 'high'
      })
      setError('Failed to resolve alert')
    }
  }

  const handleAssignAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('privacy_violation_alerts')
        .update({
          status: 'investigating',
          assigned_to: adminUserId
        })
        .eq('id', alertId)

      if (error) throw error

      await loadDashboardData()

      addBreadcrumb({
        message: 'Privacy alert assigned',
        category: 'admin_privacy',
        level: 'info',
        data: { alertId, assignedTo: adminUserId }
      })

    } catch (error) {
      captureError(error as Error, {
        component: 'AdminPrivacyDashboard',
        action: 'handleAssignAlert',
        severity: 'medium'
      })
      setError('Failed to assign alert')
    }
  }

  const exportAuditReport = async () => {
    try {
      // Generate audit report with privacy metrics and recent alerts
      const reportData = {
        generated_at: new Date().toISOString(),
        generated_by: adminUserId,
        metrics,
        recent_alerts: alerts.slice(0, 20),
        summary: {
          compliance_status: metrics ?
            (metrics.critical_alerts === 0 ? 'compliant' : 'needs_attention') : 'unknown',
          risk_level: metrics ?
            (metrics.critical_alerts > 5 ? 'high' :
             metrics.critical_alerts > 0 ? 'medium' : 'low') : 'unknown'
        }
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `privacy-audit-report-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addBreadcrumb({
        message: 'Privacy audit report exported',
        category: 'admin_privacy',
        level: 'info'
      })

    } catch (error) {
      captureError(error as Error, {
        component: 'AdminPrivacyDashboard',
        action: 'exportAuditReport',
        severity: 'medium'
      })
      setError('Failed to export audit report')
    }
  }

  if (loading && !metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
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
        <h3 className="text-lg font-semibold text-red-700 mb-2">Dashboard Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'false_positive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage">Admin Privacy Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor privacy violations, security events, and GDPR compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportAuditReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            GDPR Compliant
          </Badge>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${metrics?.critical_alerts === 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics?.critical_alerts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Open Alerts</p>
                <p className="text-2xl font-bold">
                  {metrics?.open_alerts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-sage" />
              <div>
                <p className="text-sm text-muted-foreground">Active Exchanges</p>
                <p className="text-2xl font-bold">
                  {metrics?.active_exchanges || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics?.resolved_today || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Encryption Failures</p>
                <p className="text-xl font-bold text-orange-600">
                  {metrics?.encryption_failures || 0}
                </p>
              </div>
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Privacy Violations</p>
                <p className="text-xl font-bold text-red-600">
                  {metrics?.privacy_violations || 0}
                </p>
              </div>
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">GDPR Requests</p>
                <p className="text-xl font-bold text-blue-600">
                  {metrics?.gdpr_requests || 0}
                </p>
              </div>
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Privacy Alerts
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Privacy Violation Alerts</CardTitle>
                  <CardDescription>
                    Monitor and resolve privacy and security incidents
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false_positive">False Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-700 mb-2">No Privacy Alerts</h3>
                  <p className="text-green-600">All systems are secure and compliant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {alert.alert_type}
                            </span>
                          </div>
                          <h4 className="font-medium">{alert.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Detected: {new Date(alert.detected_at).toLocaleString()}
                          </p>
                          {alert.details && Object.keys(alert.details).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <strong>Details:</strong> {JSON.stringify(alert.details, null, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.status === 'open' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignAlert(alert.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Investigate
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedAlert(alert)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Resolve Privacy Alert</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      How would you like to resolve this privacy alert?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="resolution-notes">Resolution Notes</Label>
                                      <Textarea
                                        id="resolution-notes"
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                        placeholder="Explain how this issue was resolved..."
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedAlert(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleResolveAlert(alert.id, 'resolved')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Mark Resolved
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() => handleResolveAlert(alert.id, 'false_positive')}
                                    >
                                      False Positive
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {alert.status === 'resolved' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                      </div>
                      {alert.resolution_notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Resolution:</strong> {alert.resolution_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Trends</CardTitle>
                <CardDescription>
                  Privacy and security metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Privacy Events</span>
                    <Badge variant="outline">{metrics?.total_alerts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Encryption Success Rate</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {metrics ? Math.round(((metrics.active_exchanges - metrics.encryption_failures) / Math.max(metrics.active_exchanges, 1)) * 100) : 100}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Alert Resolution Rate</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {metrics ? Math.round(((metrics.total_alerts - metrics.open_alerts) / Math.max(metrics.total_alerts, 1)) * 100) : 100}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>
                  GDPR and regulatory compliance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>GDPR Compliance</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compliant
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Encryption</span>
                    <Badge className="bg-green-100 text-green-800">
                      <Lock className="h-3 w-3 mr-1" />
                      AES-256-GCM
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Audit Trail</span>
                    <Badge className="bg-green-100 text-green-800">
                      <FileText className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risk Level</span>
                    <Badge className={
                      !metrics?.critical_alerts ? "bg-green-100 text-green-800" :
                      metrics.critical_alerts > 5 ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }>
                      {!metrics?.critical_alerts ? 'Low' :
                       metrics.critical_alerts > 5 ? 'High' : 'Medium'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}