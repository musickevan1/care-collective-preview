/**
 * @fileoverview Skip to main content link for keyboard and screen reader accessibility
 * Implements WCAG 2.4.1 (Level A) - Bypass Blocks requirement
 */

import { ReactElement } from 'react';

/**
 * Skip to main content link
 *
 * Provides a keyboard-accessible skip link that allows users to bypass
 * navigation and jump directly to the main content area.
 *
 * Features:
 * - Hidden by default (sr-only)
 * - Visible when focused (keyboard navigation)
 * - Positioned at top of viewport when visible
 * - Links to #main-content anchor
 *
 * @returns Skip navigation link component
 */
export function SkipToContent(): ReactElement {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sage focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
