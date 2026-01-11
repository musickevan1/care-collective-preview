// This file is used to initialize Sentry's server-side instrumentation.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
