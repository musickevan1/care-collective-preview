'use client'

import { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Shield, User, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SettingsLayoutProps {
  children: ReactNode
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="min-h-[44px]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-sm text-secondary-foreground/70">
                Manage your account preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
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
    </div>
  )
}
