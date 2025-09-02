import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
// Temporarily disabled to fix build issues
// import { PerformanceMonitor } from '@/components/PerformanceMonitor'
import { ReadableModeToggle } from '@/components/ReadableModeToggle'
import { MobileNav } from '@/components/MobileNav'

export default async function PerformancePage() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Handle profile errors gracefully
  if (profileError) {
    console.error('Profile query error in admin:', profileError)
    redirect('/dashboard?error=admin_required')
  }

  if (!profile?.is_admin) {
    redirect('/dashboard?error=admin_required')
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back to Admin
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Image 
                src="/logo.png" 
                alt="Care Collective Logo" 
                width={24} 
                height={24}
                className="rounded flex-shrink-0"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Performance Dashboard</h1>
                <p className="text-xs sm:text-sm text-secondary-foreground/70 hidden sm:block">Monitor application performance and Core Web Vitals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
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
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2">📊 Performance Analytics</h2>
          <p className="text-sm sm:text-base text-blue-800">
            Real-time performance monitoring to ensure optimal user experience for community members accessing critical services.
          </p>
        </div>

        {/* Performance Monitor */}
        {/* Temporarily disabled to fix build issues */}
        {/* <PerformanceMonitor showDetails={true} /> */}
        <div className="text-center text-muted-foreground py-8">
          Performance monitoring temporarily disabled for deployment
        </div>

        {/* Performance Optimization Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Optimization Guide</CardTitle>
            <CardDescription>
              Best practices for maintaining fast loading times for community members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🖼️ Image Optimization</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Using Next.js Image component with WebP/AVIF formats</li>
                  <li>• Lazy loading for below-the-fold images</li>
                  <li>• Responsive image sizing with proper breakpoints</li>
                  <li>• Preloading critical images (logo, hero images)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚡ Code Splitting</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dynamic imports for admin-only components</li>
                  <li>• Route-based code splitting with Next.js</li>
                  <li>• Lazy loading of heavy UI components</li>
                  <li>• Optimized bundle chunking strategy</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🗄️ Caching Strategy</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service Worker with stale-while-revalidate</li>
                  <li>• Database query caching for static content</li>
                  <li>• HTTP caching with proper cache headers</li>
                  <li>• CDN optimization for static assets</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📱 Mobile Optimization</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Touch-friendly 44px minimum target sizes</li>
                  <li>• Optimized font loading with display: swap</li>
                  <li>• Reduced JavaScript for mobile devices</li>
                  <li>• Progressive web app capabilities</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4 mt-6">
              <h4 className="font-semibold mb-2">🎯 Performance Targets</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">LCP</div>
                  <div className="text-green-600">&lt; 2.5s</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">FID</div>
                  <div className="text-green-600">&lt; 100ms</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">CLS</div>
                  <div className="text-green-600">&lt; 0.1</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">TTFB</div>
                  <div className="text-green-600">&lt; 800ms</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Tools */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Tools</CardTitle>
            <CardDescription>
              Available tools for performance analysis and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-medium">Bundle Analyzer</span>
                <span className="text-sm text-muted-foreground mt-1">
                  Run <code className="bg-muted px-1 rounded">npm run bundle-analyze</code>
                </span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-medium">Lighthouse Test</span>
                <span className="text-sm text-muted-foreground mt-1">
                  Run <code className="bg-muted px-1 rounded">npm run perf:lighthouse</code>
                </span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-medium">Build Profile</span>
                <span className="text-sm text-muted-foreground mt-1">
                  Run <code className="bg-muted px-1 rounded">npm run build:profile</code>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}