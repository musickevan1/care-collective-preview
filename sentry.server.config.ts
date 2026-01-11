// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

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
    // Don't send user emails or personal info
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
