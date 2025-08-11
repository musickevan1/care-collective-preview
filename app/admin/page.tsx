import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'

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
              <Link href="/" className="text-xl font-bold">
                CARE Collective
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
                <Link href="/requests" className="hover:text-accent transition-colors">Requests</Link>
                <Link href="/admin" className="text-accent">Admin</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ReadableModeToggle />
              <form action="/api/auth/logout" method="post">
                <Button variant="destructive" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Preview Notice */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">🔍 Admin Preview - Read Only</h2>
          <p className="text-muted-foreground">
            This is a preview of the admin panel. All data is read-only for demonstration purposes.
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor the CARE Collective community
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              Common administrative tasks (Preview Mode)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Active</div>
                <p className="text-sm text-muted-foreground">Database</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Online</div>
                <p className="text-sm text-muted-foreground">Authentication</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Preview</div>
                <p className="text-sm text-muted-foreground">Mode</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}