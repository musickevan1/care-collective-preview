/**
 * @fileoverview Unified platform layout component
 * Provides consistent navigation and messaging integration throughout the platform
 */

'use client';

import { ReactElement, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileNav } from '@/components/MobileNav';
import { LogoutButton } from '@/components/LogoutButton';
import { NotificationDropdown } from '@/components/notifications';
import {
  MessageCircle,
  Home,
  PlusCircle,
  Search,
  User,
  Settings,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
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
  mobileNavVariant?: 'dashboard' | 'admin';
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
  breadcrumbs = [],
  mobileNavVariant = 'dashboard'
}: PlatformLayoutProps): ReactElement {
  const pathname = usePathname();

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
      icon: Search,
      exactMatch: true
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
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      exactMatch: true
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      exactMatch: false
    },
    // Conditionally add Admin Panel link for admin users
    ...(user?.isAdmin ? [{
      href: '/admin',
      label: 'Admin Panel',
      icon: Shield,
      exactMatch: false
    }] : [])
  ];

  const isActive = useCallback((item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }, [pathname]);

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
      <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                <Image
                  src="/logo-textless.png"
                  alt="CARE Collective Logo"
                  width={56}
                  height={56}
                  className="rounded w-12 h-12 sm:w-14 sm:h-14"
                  priority
                />
                <span className="font-bold text-xl text-secondary hidden sm:block">
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
              <NotificationDropdown />

              {/* User Menu - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-secondary">
                    {user.name}
                  </span>
                </Link>
                <LogoutButton size="sm" />
              </div>

              {/* Mobile Navigation */}
              <MobileNav variant={mobileNavVariant} isAdmin={user?.isAdmin || false} />
            </div>
          </div>
        </div>
      </header>

      {/* Messaging Context Bar (when in messaging areas) - hidden on keyboard open via CSS */}
      {showMessagingContext && (
        <div className="messaging-context-bar border-b bg-sage/5">
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
                className="border-sage/30 text-sage hover:bg-sage/5 whitespace-nowrap"
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
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}