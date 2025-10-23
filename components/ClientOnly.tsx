/**
 * @fileoverview ClientOnly Component
 * Prevents hydration mismatches by only rendering children on the client-side
 * Useful for components that depend on browser APIs or locale-specific formatting
 */

'use client'

import { ReactElement, ReactNode, useState, useEffect } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only on the client side after hydration
 * Prevents hydration mismatches for components that use:
 * - Date/time formatting with locales
 * - Browser-specific APIs
 * - Window/document references
 *
 * @param children - Content to render only on client
 * @param fallback - Optional placeholder during SSR (default: null)
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps): ReactElement | null {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
