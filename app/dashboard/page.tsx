import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'
import { MobileNav } from '@/components/MobileNav'
import Link from 'next/link'
import Image from 'next/image'

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  console.log('[Dashboard] Page render started')
  
  let supabase
  let user = null
  let profile = null
  let profileError = null

  try {
    console.log('[Dashboard] Creating Supabase client...')
    supabase = await createClient()

    console.log('[Dashboard] Getting authenticated user...')
    const { data: userData, error: authError } = await supabase.auth.getUser()
    user = userData.user
    
    if (authError || !user) {
      console.log('[Dashboard] No authenticated user, redirecting to login')
      redirect('/login')
    }

    console.log('[Dashboard] Querying user profile...', { userId: user.id })
    const { data: profileData, error: profileQueryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = profileData
    profileError = profileQueryError

    console.log('[Dashboard] Profile query result:', { 
      hasProfile: !!profile, 
      error: profileQueryError?.message,
      errorCode: profileQueryError?.code
    })

    // Handle profile errors gracefully - profile might not exist yet
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[Dashboard] Profile query error:', profileError)
    }

  } catch (error) {
    console.error('[Dashboard] Caught exception:', error)
    throw error // Let error boundary handle it
  }

  const resolvedSearchParams = await searchParams
  const isAdmin = profile?.is_admin || false
  const hasAdminError = resolvedSearchParams.error === 'admin_required'

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#mobile-navigation-menu" className="skip-link">
        Skip to navigation
      </a>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-secondary text-secondary-foreground shadow-lg">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="Care Collective Logo" 
                width={32} 
                height={32}
                className="rounded"
                priority
                sizes="32px"
              />
              <span className="text-lg sm:text-xl font-bold truncate">CARE Collective</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
              <nav className="flex items-center gap-3 xl:gap-4">
                <Link href="/dashboard" className="bg-accent/20 text-accent px-3 py-2 rounded-lg font-semibold min-h-[44px] flex items-center text-sm xl:text-base">Dashboard</Link>
                <Link href="/requests" className="hover:text-accent transition-colors px-3 py-2 rounded-lg min-h-[44px] flex items-center text-sm xl:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary">Requests</Link>
                {isAdmin && (
                  <Link href="/admin" className="hover:text-accent transition-colors px-3 py-2 rounded-lg min-h-[44px] flex items-center text-sm xl:text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary">
                    Admin
                    <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
                  </Link>
                )}
              </nav>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              <ReadableModeToggle />
              <form action="/api/auth/logout" method="post" className="inline">
                <Button 
                  size="sm" 
                  type="submit"
                  variant="terracotta"
                  className="min-h-[44px] px-3 xl:px-4 text-sm xl:text-base"
                >
                  Sign Out
                </Button>
              </form>
            </div>
            
            {/* Mobile Navigation */}
            <div className="lg:hidden flex items-center gap-2">
              <ReadableModeToggle />
              <MobileNav isAdmin={isAdmin} />
            </div>
          </div>
        </nav>
      </header>

      {/* Dashboard Content */}
      <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:pb-8">
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
      </main>
    </div>
  )
}