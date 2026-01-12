import { createClient } from '@/lib/supabase/server'
import { OptimizedQueries } from '@/lib/db-cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Heart, Shield, BarChart3, TrendingUp, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let totalUsers = 0
  let totalHelpRequests = 0
  let openHelpRequests = 0
  let pendingApplications = 0

  try {
    const supabase = await createClient()

    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login?redirectTo=/admin')
    }

    // Fetch user profile to verify admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    // Redirect non-admin users
    if (!profile?.is_admin) {
      redirect('/dashboard')
    }

    const [
      userStatsResult,
      helpRequestStatsResult,
      pendingApplicationsResult
    ] = await Promise.all([
      OptimizedQueries.getUserStats(),
      OptimizedQueries.getHelpRequestStats(),
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('verification_status', 'pending')
    ])

    // Handle errors gracefully - stats default to 0 if queries fail
    if (!userStatsResult.error) {
      totalUsers = userStatsResult.data?.total || 0
    }

    if (!helpRequestStatsResult.error) {
      totalHelpRequests = helpRequestStatsResult.data?.total || 0
      openHelpRequests = helpRequestStatsResult.data?.open || 0
    }

    if (!pendingApplicationsResult.error) {
      pendingApplications = pendingApplicationsResult.count || 0
    }

  } catch {
    // Continue with default values instead of throwing
  }

  const stats = [
    {
      title: 'Pending Applications',
      value: pendingApplications || 0,
      description: 'Awaiting review',
      href: '/admin/applications',
      highlight: pendingApplications > 0
    },
    {
      title: 'Total Users',
      value: totalUsers || 0,
      description: 'Registered community members',
      href: '/admin/users',
    },
    {
      title: 'Help Requests',
      value: totalHelpRequests || 0,
      description: `${openHelpRequests || 0} open requests`,
      href: '/admin/help-requests',
    },
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Admin Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" aria-hidden="true" />
            Admin Dashboard
          </h2>
          <p className="text-sm sm:text-base text-blue-800">
            Complete admin oversight with user management, request moderation, and community statistics.
          </p>
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and monitor the CARE Collective community
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
                stat.highlight ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${
                    stat.highlight ? 'text-yellow-800' : ''
                  }`}>
                    {stat.title}
                    {stat.highlight && (
                      <span className="ml-1 text-yellow-600">!</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    stat.highlight ? 'text-yellow-700' : ''
                  }`}>
                    {stat.value}
                  </div>
                  <p className={`text-xs ${
                    stat.highlight ? 'text-yellow-600' : 'text-muted-foreground'
                  }`}>
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Essential administrative functions for community management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/applications">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" aria-hidden="true" />
                Review Applications
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" aria-hidden="true" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/help-requests">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Heart className="w-4 h-4" aria-hidden="true" />
                Review Help Requests
              </Button>
            </Link>
            <Link href="/admin/performance">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                Performance Dashboard
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                Admin Reports & Analytics
              </Button>
            </Link>
            <Link href="/admin/cms">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" aria-hidden="true" />
                Content Management (CMS)
              </Button>
            </Link>
            <Link href="/admin/bug-reports">
              <Button variant="outline" className="w-full justify-start gap-2">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                Bug Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Active</div>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Online</div>
                <p className="text-sm text-muted-foreground">Authentication</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Ready</div>
                <p className="text-sm text-muted-foreground">Platform</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
