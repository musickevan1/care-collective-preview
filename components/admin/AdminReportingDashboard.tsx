'use client'

import { useState, useEffect, ReactElement } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Users,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react'

interface CommunityMetrics {
  total_users: number
  active_users: number
  pending_users: number
  new_users_30d: number
  total_help_requests: number
  open_requests: number
  completed_requests: number
  new_requests_7d: number
  total_messages: number
  messages_24h: number
  total_reports: number
  pending_reports: number
  avg_resolution_hours: number
  last_updated: string
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high'
}

interface BulkOperation {
  id: string
  operation_type: string
  total_count: number
  success_count: number
  failure_count: number
  status: string
  started_at: string
  completed_at?: string
  admin_name: string
}

export function AdminReportingDashboard(): ReactElement {
  const [metrics, setMetrics] = useState<CommunityMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [recentOperations, setRecentOperations] = useState<BulkOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch community metrics
      const [metricsResponse, operationsResponse] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/bulk-operations?limit=10')
      ])

      if (!metricsResponse.ok || !operationsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const metricsData = await metricsResponse.json()
      const operationsData = await operationsResponse.json()

      setMetrics(metricsData.metrics)
      setRecentOperations(operationsData.operations || [])
      setLastRefresh(new Date())

      // Generate mock recent activity (in production, this would come from audit logs)
      setRecentActivity([
        {
          id: '1',
          type: 'user_approved',
          description: 'User "Jane Smith" approved by admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          severity: 'low'
        },
        {
          id: '2',
          type: 'message_reported',
          description: 'Message reported for inappropriate content',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          severity: 'medium'
        },
        {
          id: '3',
          type: 'bulk_operation',
          description: '15 users activated in bulk operation',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          severity: 'low'
        }
      ])

      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Set up auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleExportData = async (type: 'users' | 'requests' | 'messages') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`Failed to export ${type} data`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `care-collective-${type}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(`Failed to export ${type} data`)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
    return null
  }

  if (isLoading && !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard data: {error}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Reporting Dashboard</h2>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Auto-refresh:</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "On" : "Off"}
            </Button>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.active_users} active, {metrics.pending_users} pending
              </p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{metrics.new_users_30d} in last 30 days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Help Requests</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_help_requests}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.open_requests} open, {metrics.completed_requests} completed
              </p>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Activity className="h-3 w-3 mr-1" />
                +{metrics.new_requests_7d} this week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_messages}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.messages_24h} in last 24 hours
              </p>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Active community
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderation</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_reports}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.pending_reports} pending review
              </p>
              {metrics.pending_reports > 0 ? (
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </div>
              ) : (
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All clear
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="operations">Bulk Operations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="exports">Data Export</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Activity</CardTitle>
              <CardDescription>Latest administrative actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.severity === 'high' ? 'bg-red-500' :
                      activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bulk Operations</CardTitle>
              <CardDescription>History of bulk administrative operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOperations.map(operation => (
                  <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {operation.operation_type.replace('bulk_user_', '').replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        By {operation.admin_name} • {formatTimeAgo(operation.started_at)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={operation.status === 'completed' ? 'default' : 'secondary'}>
                        {operation.status}
                      </Badge>
                      <p className="text-sm">
                        {operation.success_count}/{operation.total_count} successful
                      </p>
                      {operation.failure_count > 0 && (
                        <p className="text-xs text-red-600">
                          {operation.failure_count} failed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {recentOperations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No bulk operations yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Health Score</CardTitle>
                <CardDescription>Overall platform wellness indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>User Activation Rate</span>
                        <span className="font-medium">
                          {Math.round((metrics.active_users / metrics.total_users) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(metrics.active_users / metrics.total_users) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Request Completion Rate</span>
                        <span className="font-medium">
                          {Math.round((metrics.completed_requests / metrics.total_help_requests) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(metrics.completed_requests / metrics.total_help_requests) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg. Resolution Time</span>
                        <span className="font-medium">{metrics.avg_resolution_hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Platform growth and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Users (30d)</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{metrics.new_users_30d}</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Requests (7d)</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{metrics.new_requests_7d}</span>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Messages (24h)</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{metrics.messages_24h}</span>
                        <Activity className="h-4 w-4 text-purple-500" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export platform data for analysis and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">User Data</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export user profiles, verification status, and registration data
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportData('users')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Users
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Help Requests</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export help requests, status, and completion data
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportData('requests')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Requests
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Messages</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export messaging data and moderation reports
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportData('messages')}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Messages
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}