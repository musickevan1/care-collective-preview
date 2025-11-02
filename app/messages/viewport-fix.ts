'use client'

/**
 * Mobile Viewport Height Fix
 *
 * Handles dynamic URL bar behavior on mobile browsers by:
 * 1. Using Visual Viewport API when available
 * 2. Setting CSS custom property --vh for fallback
 * 3. Updating on resize, scroll, and orientation change
 *
 * This ensures the messaging interface stays properly sized
 * when the URL bar shows/hides on mobile browsers.
 */

export function initializeViewportFix() {
  // Only run on client side
  if (typeof window === 'undefined') return

  const updateViewportHeight = () => {
    // Use Visual Viewport API if available (best for mobile)
    if ('visualViewport' in window && window.visualViewport) {
      const vh = window.visualViewport.height * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    } else {
      // Fallback to window.innerHeight
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
  }

  // Initial update
  updateViewportHeight()

  // Update on resize (URL bar show/hide)
  if ('visualViewport' in window && window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportHeight)
    window.visualViewport.addEventListener('scroll', updateViewportHeight)
  } else {
    window.addEventListener('resize', updateViewportHeight)
  }

  // Update on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportHeight, 100)
  })

  // Cleanup function
  return () => {
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', updateViewportHeight)
      window.visualViewport.removeEventListener('scroll', updateViewportHeight)
    } else {
      window.removeEventListener('resize', updateViewportHeight)
    }
    window.removeEventListener('orientationchange', updateViewportHeight)
  }
}
