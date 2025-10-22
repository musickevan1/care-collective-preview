'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect media query matches (e.g., screen size)
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)')
 * const isMobile = useMediaQuery('(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create listener for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }

    // Fallback for older browsers
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [query])

  return matches
}
