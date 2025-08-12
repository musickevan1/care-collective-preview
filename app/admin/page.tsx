import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'
import { MobileNav } from '@/components/MobileNav'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get basic statistics (simplified for preview)
  const [
    { count: totalUsers },
    { count: totalHelpRequests },
    { count: openHelpRequests },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }),
    supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const stats = [
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
                  className="bg-[#BC6547] hover:bg-[#A55439] text-white"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
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
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                👥 Manage Users
              </Button>
            </Link>
            <Link href="/admin/help-requests">
              <Button variant="outline" className="w-full justify-start">
                📋 Review Help Requests
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