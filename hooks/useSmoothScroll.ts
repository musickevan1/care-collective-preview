import React, { useCallback } from 'react';

/**
 * Custom hook for smooth scrolling to anchor links with fixed header offset
 * Dynamically detects header height for responsive accuracy
 * Provides consistent smooth scrolling behavior across application
 */
export function useSmoothScroll() {
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');

    if (href?.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // DYNAMIC header height detection
        const header = document.querySelector('header.fixed');
        const headerHeight = header ? header.offsetHeight : 64;
        const buffer = 16;

        // Ensure minimum offset matches CSS scroll-padding-top (80px)
        const scrollOffset = Math.max(headerHeight + buffer, 80);

        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - scrollOffset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  return handleSmoothScroll;
}
