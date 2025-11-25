'use client'

import React, { useState, useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

interface MobileNavProps {
  isAdmin?: boolean
  variant?: 'homepage' | 'dashboard'
}

// Navigation items for different contexts
const getNavItems = (variant: 'homepage' | 'dashboard', isAdmin: boolean, isAuthenticated: boolean) => {
  if (variant === 'homepage') {
    if (isAuthenticated) {
      return [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/requests', label: 'Browse Requests' },
        { href: '/requests/new', label: 'New Request' },
        { href: '/messages', label: 'Messages' },
        { href: '/profile', label: 'Profile' },
        ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : [])
      ]
    } else {
      return [
        { href: '#home', label: 'Home' },
        { href: '#how-it-works', label: 'How It Works' },
        { href: '#why-join', label: 'Why Join?' },
        { href: '#about', label: 'About Us' },
        { href: '#whats-happening', label: 'What\'s Happening' },
        { href: '#resources-preview', label: 'Resources' },
        { href: '#contact-preview', label: 'Contact Us' }
      ]
    }
  } else {
    // Dashboard variant (existing behavior)
    return isAdmin ? [
      { href: '/admin', label: 'Overview' },
      { href: '/admin/help-requests', label: 'Manage Requests' },
      { href: '/admin/users', label: 'Manage Users' },
    ] : [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/requests', label: 'Browse Requests' },
      { href: '/requests/new', label: 'New Request' },
      { href: '/messages', label: 'Messages' },
      { href: '/profile', label: 'Profile' },
    ]
  }
}

export const MobileNav = memo<MobileNavProps>(({ isAdmin = false, variant = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, isAdmin: userIsAdmin, displayName, isLoading, user } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()
  
  // Use prop isAdmin for dashboard variant, userIsAdmin for homepage variant
  const effectiveIsAdmin = variant === 'dashboard' ? isAdmin : userIsAdmin

  // Focus management when menu opens/closes
  const focusFirstMenuItem = useCallback(() => {
    const firstMenuItem = document.querySelector('#mobile-navigation-menu a, #mobile-navigation-menu button') as HTMLElement
    if (firstMenuItem) {
      firstMenuItem.focus()
    }
  }, [])

  // Memoize the toggle function to prevent recreation
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev
      // Focus first menu item when opening
      if (newState) {
        setTimeout(focusFirstMenuItem, 100)
      }
      return newState
    })
  }, [focusFirstMenuItem])

  // Memoize nav items based on variant, auth status, and admin status
  const navItems = useMemo(() => getNavItems(variant, effectiveIsAdmin, isAuthenticated), [variant, effectiveIsAdmin, isAuthenticated])

  // Memoize close handler to prevent recreation
  const handleClose = useCallback(() => setIsOpen(false), [])

  // Memoize overlay click handler
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(false)
  }, [])

  // Handle escape key to close menu and improve keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      // Return focus to hamburger button when closing with escape
      const hamburgerButton = document.querySelector('[aria-controls="mobile-navigation-menu"]') as HTMLButtonElement
      if (hamburgerButton) {
        hamburgerButton.focus()
      }
    }
  }, [])

  // Always show hamburger menu - don't block UI during auth loading
  // The auth loading should not prevent navigation access

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className={`mobile-nav-button p-2 rounded-lg transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center relative ${
          variant === 'homepage' 
            ? (isOpen 
                ? 'bg-white/25 text-white shadow-lg scale-105' 
                : 'text-white/90 hover:text-white')
            : (isOpen 
                ? 'bg-secondary/20 text-secondary shadow-lg scale-105 border border-secondary/30' 
                : 'text-secondary hover:text-secondary/80 hover:bg-secondary/5 border border-secondary/20')
        }`}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {/* Hamburger icon */}
          <svg
            className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0 rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100'
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          {/* Close icon */}
          <svg
            className={`absolute w-6 h-6 transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-45 scale-75'
            }`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          role="dialog" 
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div 
            id="mobile-navigation-menu"
            className={`mobile-nav-menu fixed right-0 top-0 h-full w-72 sm:w-80 bg-secondary shadow-2xl transform transition-transform duration-300 ease-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
            role="navigation"
            aria-label="Main navigation"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-secondary/50">
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-secondary-foreground">Menu</h2>
                {variant === 'homepage' && isAuthenticated && displayName && (
                  <p className="text-sm text-secondary-foreground/70 mt-1">Welcome, {displayName}</p>
                )}
                {variant === 'dashboard' && isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-accent/20 text-accent rounded-full font-medium">Admin</span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-secondary-foreground min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-105 active:scale-95"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-3 sm:p-4 flex-1 overflow-y-auto">
              <ul className="space-y-0.5">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href
                  const linkClassName = `block px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage focus:ring-inset group relative ${
                    isActive
                      ? 'bg-white/20 text-secondary-foreground font-semibold shadow-sm'
                      : 'text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground hover:translate-x-1'
                  }`
                  
                  return (
                    <li key={item.href} style={{ animationDelay: `${index * 50}ms` }} className="animate-in slide-in-from-right-4 duration-300">
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (item.href.startsWith('#')) {
                            handleSmoothScroll(e);
                          }
                          handleClose();
                        }}
                        className={linkClassName}
                      >
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-sage rounded-full"></div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Authentication section */}
              <div className="mt-3 pt-4 border-t border-white/10 bg-secondary/20 -mx-3 sm:-mx-4 px-3 sm:px-4 pb-3 sm:pb-4">
                {variant === 'homepage' ? (
                  isLoading ? (
                    <div className="space-y-2">
                      <div className="text-center pb-1">
                        <p className="text-sm text-secondary-foreground/70">Loading...</p>
                      </div>
                      <div className="w-full px-4 py-3 bg-secondary/50 rounded-lg min-h-[48px] flex items-center justify-center">
                        <svg className="w-5 h-5 animate-spin text-secondary-foreground/70" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </div>
                  ) : isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="text-center pb-1">
                        <p className="text-sm text-secondary-foreground/70">Signed in as:</p>
                        <p className="font-semibold text-secondary-foreground">{displayName || user?.email || 'Member'}</p>
                      </div>
                      <LogoutButton
                        variant="destructive"
                        size="default"
                        className="w-full min-h-[48px] font-semibold"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center pb-1">
                        <p className="text-sm text-secondary-foreground/70">Join the Community</p>
                      </div>
                      <Link
                        href="/signup"
                        onClick={handleClose}
                        className="block w-full px-4 py-3 bg-sage text-white rounded-lg font-semibold hover:bg-sage-dark transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage-light text-center min-h-[48px] flex items-center justify-center group"
                      >
                        <span>Join Community</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                      <Link
                        href="/login"
                        onClick={handleClose}
                        className="block w-full px-4 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white text-center min-h-[48px] flex items-center justify-center group"
                      >
                        <span>Member Login</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-center pb-1">
                      <p className="text-sm text-secondary-foreground/70">Signed in as:</p>
                      <p className="font-semibold text-secondary-foreground">{displayName || user?.email || 'Member'}</p>
                    </div>
                    <LogoutButton
                      variant="destructive"
                      size="default"
                      className="w-full min-h-[48px] font-semibold"
                    />
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
})

MobileNav.displayName = 'MobileNav'