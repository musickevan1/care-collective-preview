'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'

interface MobileNavProps {
  isAdmin?: boolean
}

// Memoized nav items to prevent recreation on every render
const getNavItems = (isAdmin: boolean) => isAdmin ? [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/help-requests', label: 'Manage Requests' },
  { href: '/admin/users', label: 'Manage Users' },
] : [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/requests', label: 'Browse Requests' },
  { href: '/requests/new', label: 'New Request' },
]

export const MobileNav = memo<MobileNavProps>(({ isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Memoize the toggle function to prevent recreation
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), [])

  // Memoize nav items based on admin status
  const navItems = useMemo(() => getNavItems(isAdmin), [isAdmin])

  // Memoize close handler to prevent recreation
  const handleClose = useCallback(() => setIsOpen(false), [])

  // Memoize overlay click handler
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(false)
  }, [])

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={handleOverlayClick}>
          <div 
            className="fixed right-0 top-0 h-full w-64 bg-secondary shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-secondary-foreground">Menu</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-secondary-foreground"
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

            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  const linkClassName = `block px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-secondary-foreground font-medium'
                      : 'text-secondary-foreground/80 hover:bg-white/10 hover:text-secondary-foreground'
                  }`
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleClose}
                        className={linkClassName}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-6 pt-6 border-t border-white/10">
                <LogoutButton />
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
})

MobileNav.displayName = 'MobileNav'