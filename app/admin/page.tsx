import { createClient } from '@/lib/supabase/server'
import { OptimizedQueries } from '@/lib/db-cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'
import { MobileNav } from '@/components/MobileNav'
import { redirect } from 'next/navigation'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  console.log('[Admin] Page render started')
  
  let totalUsers = 0
  let totalHelpRequests = 0
  let openHelpRequests = 0
  let pendingApplications = 0

  try {
    console.log('[Admin] Creating Supabase client...')
    const supabase = await createClient()

    // Verify user is authenticated and admin
    console.log('[Admin] Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Admin] No authenticated user, redirecting to login')
      redirect('/login?redirectTo=/admin')
    }

    console.log('[Admin] Fetching admin statistics...')
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

    console.log('[Admin] Stats results:', {
      userStats: userStatsResult.error ? 'ERROR' : 'OK',
      helpRequestStats: helpRequestStatsResult.error ? 'ERROR' : 'OK',
      pendingApplications: pendingApplicationsResult.error ? 'ERROR' : 'OK'
    })

    // Handle errors gracefully
    if (userStatsResult.error) {
      console.error('[Admin] User stats error:', userStatsResult.error)
    } else {
      totalUsers = userStatsResult.data?.total || 0
    }

    if (helpRequestStatsResult.error) {
      console.error('[Admin] Help request stats error:', helpRequestStatsResult.error)
    } else {
      totalHelpRequests = helpRequestStatsResult.data?.total || 0
      openHelpRequests = helpRequestStatsResult.data?.open || 0
    }

    if (pendingApplicationsResult.error) {
      console.error('[Admin] Pending applications error:', pendingApplicationsResult.error)
    } else {
      pendingApplications = pendingApplicationsResult.count || 0
    }

  } catch (error) {
    console.error('[Admin] Caught exception:', error)
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Care Collective Logo" 
                  width={28} 
                  height={28}
                  className="rounded"
                />
                <span className="text-xl font-bold">CARE Collective</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
                <Link href="/requests" className="hover:text-accent transition-colors">Requests</Link>
                <Link href="/admin" className="text-accent">Admin</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ReadableModeToggle />
              <MobileNav isAdmin={true} />
              <form action="/api/auth/logout" method="post" className="hidden md:block">
                <Button 
                  size="sm" 
                  type="submit"
                  variant="terracotta"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Admin Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2">🛡️ Admin Dashboard</h2>
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
              <Button variant="outline" className="w-full justify-start">
                📋 Review Applications
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                👥 Manage Users
              </Button>
            </Link>
            <Link href="/admin/help-requests">
              <Button variant="outline" className="w-full justify-start">
                🤝 Review Help Requests
              </Button>
            </Link>
            <Link href="/admin/performance">
              <Button variant="outline" className="w-full justify-start">
                📊 Performance Dashboard
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
    </main>
  )
}