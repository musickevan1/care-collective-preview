// Global polyfills for server-side execution
// This must be imported before any other modules to prevent SSR errors

// Polyfill self for server-side environment (critical for web-vitals)
if (typeof global !== 'undefined' && typeof self === 'undefined') {
  global.self = global;
}

// Ensure other common browser globals are available
if (typeof global !== 'undefined') {
  if (typeof window === 'undefined') {
    global.window = global;

    // Add minimal window properties needed for web-vitals
    global.window.performance = {
      getEntriesByType: () => [],
      getEntriesByName: () => [],
      mark: () => {},
      measure: () => {},
      now: () => Date.now(),
      navigation: { type: 0 },
      timing: {}
    };

    // Add requestAnimationFrame and cancelAnimationFrame
    global.window.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 16);
    };
    global.window.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }

  if (typeof document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      createElementNS: () => ({}),
      documentElement: {},
      head: {},
      body: {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      readyState: 'complete',
      visibilityState: 'visible'
    };
  }

  if (typeof navigator === 'undefined') {
    global.navigator = {
      userAgent: 'Node.js',
      connection: { effectiveType: '4g' }
    };
  }

  // Polyfill for ResizeObserver (used by some performance monitoring)
  if (typeof ResizeObserver === 'undefined') {
    global.ResizeObserver = class ResizeObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Polyfill for IntersectionObserver
  if (typeof IntersectionObserver === 'undefined') {
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Polyfill for PerformanceObserver (critical for web-vitals)
  if (typeof PerformanceObserver === 'undefined') {
    global.PerformanceObserver = class PerformanceObserver {
      constructor() {}
      observe() {}
      disconnect() {}
      static supportedEntryTypes = [];
    };
  }
}

module.exports = {};