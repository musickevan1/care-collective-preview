'use client'

import { ReactElement, ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Handshake,
  BarChart3,
  TrendingUp,
  FileEdit,
  AlertCircle,
  MessageSquare,
  Lock,
  ArrowLeft,
  Shield,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: ReactNode
}

interface UserData {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

const adminNav = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Dashboard and key metrics',
  },
  {
    name: 'Manage Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management and roles',
  },
  {
    name: 'Review Applications',
    href: '/admin/applications',
    icon: FileText,
    description: 'Pending membership applications',
  },
  {
    name: 'Review Help Requests',
    href: '/admin/help-requests',
    icon: Handshake,
    description: 'Moderate community requests',
  },
  {
    name: 'Performance Dashboard',
    href: '/admin/performance',
    icon: BarChart3,
    description: 'Core Web Vitals and metrics',
  },
  {
    name: 'Reports & Analytics',
    href: '/admin/reports',
    icon: TrendingUp,
    description: 'Community insights and reports',
  },
  {
    name: 'Content Management',
    href: '/admin/cms',
    icon: FileEdit,
    description: 'Manage site content',
  },
  {
    name: 'Bug Reports',
    href: '/admin/bug-reports',
    icon: AlertCircle,
    description: 'Review submitted bug reports',
  },
  {
    name: 'Message Moderation',
    href: '/admin/messaging/moderation',
    icon: MessageSquare,
    description: 'Moderate community messages',
  },
  {
    name: 'Privacy Dashboard',
    href: '/admin/privacy',
    icon: Lock,
    description: 'Privacy violations and security',
  },
]

export default function AdminLayout({ children }: AdminLayoutProps): ReactElement {
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, is_admin')
            .eq('id', authUser.id)
            .single()

          setUser({
            id: authUser.id,
            name: profile?.name || authUser.email?.split('@')[0] || 'Admin',
            email: authUser.email || '',
            isAdmin: profile?.is_admin || false
          })
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Admin signup page should render without the sidebar layout
  const isAdminSignup = pathname === '/admin/signup'
  if (isAdminSignup) {
    return <>{children}</>
  }

  // Show loading state while fetching user
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    )
  }

  // Helper to check if a nav item is active
  // Overview uses exact match, others use startsWith for nested routes
  const isActiveNavItem = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <PlatformLayout user={user || undefined}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Admin page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-sage" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the CARE Collective community
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border p-2 space-y-1">
              {/* Back to Dashboard Button */}
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground mb-2 border-b pb-3"
              >
                <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>

              {adminNav.map((item) => {
                const isActive = isActiveNavItem(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-sage text-white'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className={cn(
                        'text-xs truncate',
                        isActive ? 'text-white/80' : 'text-muted-foreground'
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </PlatformLayout>
  )
}
