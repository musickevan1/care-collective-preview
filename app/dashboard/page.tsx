import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'
import { MobileNav } from '@/components/MobileNav'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const resolvedSearchParams = await searchParams
  const isAdmin = profile?.is_admin || false
  const hasAdminError = resolvedSearchParams.error === 'admin_required'

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
                <Link href="/dashboard" className="text-accent">Dashboard</Link>
                <Link href="/requests" className="hover:text-accent transition-colors">Requests</Link>
                {isAdmin && (
                  <Link href="/admin" className="hover:text-accent transition-colors">Admin</Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ReadableModeToggle />
              <MobileNav isAdmin={isAdmin} />
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

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Error Messages */}
        {hasAdminError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
            <p className="text-destructive/80">
              You don&apos;t have admin privileges to access the admin panel. Contact an administrator if you believe this is an error.
            </p>
          </div>
        )}

        {/* Preview Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Preview Mode</h3>
              <p className="text-blue-800 text-sm">
                This is a demonstration of the member portal functionality. In production, users will access this dashboard through your main Wix website after logging in.
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.name || user.email}!
            {isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
          </h2>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening in your community today. 
              <Link href="/help/workflows" className="text-sage hover:text-sage-dark underline ml-1">
                Learn how it works
              </Link>
            </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🙋‍♀️</span>
                Need Help?
              </CardTitle>
              <CardDescription className="text-base">
                Post a request and let the community help you out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/requests/new">
                <Button className="w-full">
                  Create Help Request
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Want to Help?
              </CardTitle>
              <CardDescription className="text-base">
                Browse requests from people who need assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/requests">
                <Button variant="secondary" className="w-full">
                  Browse Requests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <p className="text-sm text-muted-foreground">Active help requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary mb-2">0</div>
              <p className="text-sm text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Helped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-2">0</div>
              <p className="text-sm text-muted-foreground">People helped</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Stay updated with what&apos;s happening in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-lg font-medium text-foreground mb-2">Welcome to Care Collective!</h3>
              <p className="text-muted-foreground mb-4">
                You&apos;re all set up. Start by creating your first help request or browse what others need.
              </p>
              <div className="flex gap-2 justify-center">
                <Badge variant="default">New Member</Badge>
                <Badge variant="secondary">Community Builder</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}