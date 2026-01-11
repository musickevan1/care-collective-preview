// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Session Replay - disabled for privacy (mutual aid platform)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment tagging
  environment: process.env.NODE_ENV || 'development',

  // Filter out sensitive data
  beforeSend(event) {
    // Scrub any PII that might leak through
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that users can't control
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // React hydration mismatches (usually benign)
    'Hydration failed',
    'Text content does not match',
  ],
});
