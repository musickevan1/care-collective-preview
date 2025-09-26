import React, { useCallback } from 'react';

/**
 * Custom hook for smooth scrolling to anchor links with fixed header offset
 * Provides consistent smooth scrolling behavior across the application
 */
export function useSmoothScroll() {
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');

    if (href?.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerHeight = 64; // h-16 in pixels (fixed header height)
        const buffer = 16; // extra buffer space for comfortable viewing
        const targetPosition = targetElement.offsetTop - headerHeight - buffer;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return handleSmoothScroll;
}