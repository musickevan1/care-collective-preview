/**
 * @fileoverview Unified platform layout component
 * Provides consistent navigation and messaging integration throughout the platform
 */

'use client';

import { ReactElement, ReactNode, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileNav } from '@/components/MobileNav';
import { LogoutButton } from '@/components/LogoutButton';
import { ReadableModeToggle } from '@/components/ReadableModeToggle';
import { 
  MessageCircle, 
  Heart, 
  Home, 
  PlusCircle, 
  Search,
  Bell,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  messagingData?: {
    unreadCount: number;
    activeConversations: number;
  };
  showMessagingContext?: boolean;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  exactMatch?: boolean;
}

export function PlatformLayout({ 
  children, 
  user, 
  messagingData = { unreadCount: 0, activeConversations: 0 },
  showMessagingContext = false,
  breadcrumbs = []
}: PlatformLayoutProps): ReactElement {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isAuthenticated = !!user;

  // Main navigation items
  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      exactMatch: true
    },
    {
      href: '/requests',
      label: 'Browse Requests',
      icon: Search
    },
    {
      href: '/requests/new',
      label: 'New Request',
      icon: PlusCircle,
      exactMatch: true
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageCircle,
      badge: messagingData.unreadCount,
      exactMatch: true
    }
  ];

  const isActive = useCallback((item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }, [pathname]);

  const handleNotificationsToggle = useCallback(() => {
    setNotificationsOpen(prev => !prev);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 bg-sage rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-secondary hidden sm:block">
                  CARE Collective
                </span>
              </Link>

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="hidden md:flex">
                  <div className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-muted-foreground">/</span>
                        {crumb.href ? (
                          <Link 
                            href={crumb.href}
                            className="ml-2 text-secondary hover:text-sage transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="ml-2 text-secondary font-medium">
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </nav>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      active 
                        ? "bg-sage/10 text-sage" 
                        : "text-muted-foreground hover:text-secondary hover:bg-secondary/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center p-0"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={handleNotificationsToggle}
              >
                <Bell className="w-4 h-4" />
                {messagingData.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>

              {/* User Menu - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-secondary">
                    {user.name}
                  </span>
                </div>
                <ReadableModeToggle />
                <LogoutButton size="sm" />
              </div>

              {/* Mobile Navigation */}
              <MobileNav variant="dashboard" />
            </div>
          </div>
        </div>
      </header>

      {/* Messaging Context Bar (when in messaging areas) */}
      {showMessagingContext && (
        <div className="border-b bg-sage/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-sage" />
                <div>
                  <h2 className="font-semibold text-secondary">Community Messages</h2>
                  <p className="text-sm text-muted-foreground">
                    {messagingData.activeConversations} active conversation{messagingData.activeConversations !== 1 ? 's' : ''}
                    {messagingData.unreadCount > 0 && (
                      <span className="ml-2 text-sage font-medium">
                        • {messagingData.unreadCount} unread
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline" 
                size="sm"
                asChild
                className="border-sage/30 text-sage hover:bg-sage/5"
              >
                <Link href="/requests">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Requests
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Quick Notifications Panel */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute top-16 right-4 w-80 bg-background border rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-secondary">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotificationsOpen(false)}
              >
                ×
              </Button>
            </div>
            
            {messagingData.unreadCount > 0 ? (
              <div className="space-y-2">
                <div className="p-3 bg-sage/5 rounded-lg border border-sage/20">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-sage" />
                    <span className="font-medium text-sm text-secondary">
                      {messagingData.unreadCount} new message{messagingData.unreadCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Community members are coordinating help requests
                  </p>
                  <Button size="sm" className="mt-2 w-full" asChild>
                    <Link href="/messages">View Messages</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}