import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <nav className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold">
              CARE Collective
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-accent transition-colors">
                Login
              </Link>
              <Link href="/signup" className="hover:text-accent transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to CARE Collective
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Building community through mutual aid in Southwest Missouri
          </p>
          <div className="bg-accent/20 rounded-lg p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-primary">Preview Instructions</h2>
            <p className="text-foreground mb-4">
              This is a preview version for client review. Here&apos;s what you can explore:
            </p>
            <ul className="text-left space-y-2 max-w-xl mx-auto">
              <li>• <strong>Sign up</strong> to create an account and access the dashboard</li>
              <li>• <strong>Create requests</strong> for help from the community</li>
              <li>• <strong>View the admin panel</strong> (read-only preview)</li>
              <li>• <strong>Explore the design system</strong> colors and typography</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-3">Authentication</h3>
            <p className="text-muted-foreground mb-4">
              Try the signup and login flows
            </p>
            <div className="space-y-2">
              <Link href="/login" className="block w-full bg-primary text-primary-foreground text-center py-2 px-4 rounded hover:bg-primary-contrast transition-colors">
                Login
              </Link>
              <Link href="/signup" className="block w-full bg-secondary text-secondary-foreground text-center py-2 px-4 rounded hover:opacity-90 transition-opacity">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-3">Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              View your personalized dashboard
            </p>
            <Link href="/dashboard" className="block w-full bg-accent text-accent-foreground text-center py-2 px-4 rounded hover:opacity-90 transition-opacity">
              Dashboard
            </Link>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-3">Admin Preview</h3>
            <p className="text-muted-foreground mb-4">
              Explore admin features (read-only)
            </p>
            <Link href="/admin" className="block w-full bg-brown text-white text-center py-2 px-4 rounded hover:opacity-90 transition-opacity">
              Admin Panel
            </Link>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-3">Design System</h3>
            <p className="text-muted-foreground mb-4">
              Review colors and typography
            </p>
            <div className="space-y-2">
              <Link href="/design-system/colors" className="block w-full bg-terracotta text-white text-center py-1 px-3 rounded text-sm hover:opacity-90 transition-opacity">
                Colors
              </Link>
              <Link href="/design-system/typography" className="block w-full bg-navy text-white text-center py-1 px-3 rounded text-sm hover:opacity-90 transition-opacity">
                Typography
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-accent/10 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Sign up to explore the full experience including creating help requests and viewing your dashboard.
          </p>
          <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-contrast transition-colors">
            Create Account
          </Link>
        </div>
      </main>
    </div>
  )
}