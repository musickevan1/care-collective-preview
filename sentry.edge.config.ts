// This file configures the initialization of Sentry for edge features (Middleware, Edge API routes).
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
});
