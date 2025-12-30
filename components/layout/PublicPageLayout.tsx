/**
 * @fileoverview Public Page Layout Component
 * Provides consistent header and footer across all public pages (about, resources, contact, help, etc.)
 * Matches homepage header design exactly with page-based navigation
 */

'use client';

import { ReactElement, ReactNode, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MobileNav } from '@/components/MobileNav';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { LogoutButton } from '@/components/LogoutButton';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { cn } from '@/lib/utils';

interface PublicPageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;  // Default: true
  className?: string;    // Optional custom classes for main content
}

interface NavItem {
  href: string;
  label: string;
}

export function PublicPageLayout({
  children,
  showFooter = true,
  className,
}: PublicPageLayoutProps): ReactElement {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, displayName } = useAuthNavigation();

  // Navigation items for public pages
  const navItems: NavItem[] = useMemo(() => [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/help', label: 'Help' },
    { href: '/resources', label: 'Resources' },
    { href: '/contact', label: 'Contact Us' },
  ], []);

  // Active state logic - exact match for homepage, partial match for others
  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] bg-sage text-white px-4 py-2 rounded-lg font-semibold focus:ring-4 focus:ring-sage/30 min-h-[44px] flex items-center"
      >
        Skip to main content
      </a>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg" role="banner">
        <nav className="container mx-auto max-w-7xl" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="CARE Collective home"
            >
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={48}
                height={48}
                className="rounded w-10 h-10 sm:w-12 sm:h-12"
                priority
                sizes="(max-width: 640px) 40px, 48px"
              />
              <span className="text-lg sm:text-xl font-bold truncate">CARE Collective</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
              <ul className="flex items-center gap-3 xl:gap-4 list-none">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap transition-colors relative",
                        isActive(item.href)
                          ? "bg-white/20 text-sage-light font-semibold"
                          : "hover:text-sage-light"
                      )}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {isActive(item.href) && (
                        <span className="absolute left-1 w-2 h-2 bg-sage rounded-full" aria-hidden="true" />
                      )}
                      <span className={isActive(item.href) ? 'pl-3' : ''}>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              {isLoading ? (
                <div className="bg-sage/50 text-white px-3 xl:px-4 py-2 rounded-lg font-semibold min-h-[44px] flex items-center animate-pulse text-sm xl:text-base">
                  Loading...
                </div>
              ) : isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="bg-secondary text-secondary-foreground px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-secondary/90 transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 min-h-[44px] flex items-center text-sm xl:text-base"
                  >
                    Dashboard
                  </Link>
                  <LogoutButton size="default" />
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="bg-sage text-white px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap"
                  >
                    Join Community
                  </Link>
                  <Link
                    href="/login"
                    className="border-2 border-white text-white px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-navy min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap"
                  >
                    Member Login
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav variant="homepage" />
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 pt-16" tabIndex={-1}>
        <div className={cn(className)}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <SiteFooter />}
    </div>
  );
}

export default PublicPageLayout;
