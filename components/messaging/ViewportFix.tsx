'use client'

import { useEffect } from 'react'
import { initializeViewportFix } from '@/app/messages/viewport-fix'

/**
 * ViewportFix - Client component that initializes mobile viewport height fix
 *
 * Handles dynamic URL bar behavior on mobile browsers to ensure
 * the messaging interface stays properly sized when URL bars show/hide.
 */
export function ViewportFix() {
  useEffect(() => {
    const cleanup = initializeViewportFix()
    return cleanup
  }, [])

  return null
}
