import Link from 'next/link'
import Image from 'next/image'
import { features } from '@/lib/features'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <nav className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Care Collective Logo" 
                width={32} 
                height={32}
                className="rounded"
              />
              <span className="text-xl font-bold">CARE Collective</span>
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
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="Care Collective Logo" 
              width={120} 
              height={120}
              className="rounded-lg shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to CARE Collective
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Building community through mutual aid in Southwest Missouri
          </p>
          <div className="bg-accent/20 rounded-lg p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-primary">🎯 Client Preview</h2>
            <p className="text-foreground mb-4">
              Welcome to the Care Collective platform preview! This demonstrates the core functionality of your community mutual aid application.
            </p>
            <div className="bg-white/50 rounded-lg p-4 mb-4">
               <h3 className="font-semibold mb-2">✨ What&apos;s Ready to Explore:</h3>
              <ul className="text-left space-y-2 text-sm">
                <li>• <strong>Complete user registration</strong> and authentication system</li>
                <li>• <strong>Help request creation</strong> with categories and urgency levels</li>
                <li>• <strong>Community browsing</strong> and request management</li>
                <li>• <strong>Admin oversight panel</strong> with full moderation capabilities</li>
                <li>• <strong>Status workflow</strong> from open → in progress → completed</li>
                <li>• <strong>Role-based permissions</strong> and audit logging</li>
              </ul>
            </div>
            
            <div className="bg-primary/10 rounded-lg p-4 mb-4 border-l-4 border-primary">
              <h3 className="font-semibold mb-2 text-primary">🔑 Admin Demo Account</h3>
              <div className="text-left space-y-1 text-sm">
                <p><strong>Email:</strong> maureen.templeman@demo.carecollective.org</p>
                <p><strong>Password:</strong> CarePreview2025!</p>
                <p className="text-muted-foreground mt-2">
                  Use these credentials to explore the full admin interface with 17 demo help requests.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This preview page will be replaced by your main Wix homepage. Users will access the member portal through your existing Wix website.
            </p>
          </div>
        </div>

        <div className={`grid md:grid-cols-2 ${features.designSystem ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-12`}>
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
            <h3 className="text-xl font-semibold mb-3">Admin Management</h3>
            <p className="text-muted-foreground mb-4">
              Full admin capabilities with moderation tools
            </p>
            <Link href="/admin" className="block w-full bg-brown text-white text-center py-2 px-4 rounded hover:opacity-90 transition-opacity">
              Admin Panel
            </Link>
          </div>

          {features.designSystem && (
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
          )}
        </div>

        <div className="bg-accent/10 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Experience the Full Platform</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Create an account to test the complete user journey from registration to community interaction.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-contrast transition-colors">
              Try the Platform
            </Link>
            <Link href="/login" className="inline-block bg-secondary text-secondary-foreground px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity">
              Demo Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}