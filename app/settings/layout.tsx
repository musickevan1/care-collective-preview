'use client'

import { ReactElement, ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Shield, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlatformLayout } from '@/components/layout/PlatformLayout'
import { createClient } from '@/lib/supabase/client'

interface SettingsLayoutProps {
  children: ReactNode
}

interface UserData {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

const settingsNav = [
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and push notification preferences',
  },
  {
    name: 'Privacy',
    href: '/settings/privacy',
    icon: Shield,
    description: 'Contact sharing and data controls',
  },
  {
    name: 'Account',
    href: '/settings/account',
    icon: User,
    description: 'Profile and account management',
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps): ReactElement {
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
            name: profile?.name || authUser.email?.split('@')[0] || 'User',
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

  // Show loading state while fetching user
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    )
  }

  return (
    <PlatformLayout user={user || undefined}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Settings page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border p-2 space-y-1">
              {settingsNav.map((item) => {
                const isActive = pathname === item.href
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
