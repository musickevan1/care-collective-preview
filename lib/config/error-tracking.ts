/**
 * @fileoverview Error Tracking Configuration
 * Centralizes error tracking service configuration for Care Collective
 */

import { z } from 'zod'

// Environment schema for error tracking configuration
const errorTrackingEnvSchema = z.object({
  // Sentry Configuration (preferred for production)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Alternative error tracking endpoint
  NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT: z.string().url().optional(),
  ERROR_TRACKING_API_KEY: z.string().optional(),

  // General configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_ERROR_TRACKING: z.string().default('true').transform(val => val === 'true'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
})

// Parse and validate environment variables
let config: z.infer<typeof errorTrackingEnvSchema>

try {
  config = errorTrackingEnvSchema.parse({
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT: process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT,
    ERROR_TRACKING_API_KEY: process.env.ERROR_TRACKING_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ENABLE_ERROR_TRACKING: process.env.ENABLE_ERROR_TRACKING,
    NODE_ENV: process.env.NODE_ENV
  })
} catch (error) {
  console.warn('Error tracking configuration validation failed:', error)
  // Fallback to safe defaults
  config = {
    LOG_LEVEL: 'info',
    ENABLE_ERROR_TRACKING: true,
    NODE_ENV: 'development'
  }
}

export const errorTrackingConfig = config

/**
 * Care Collective specific error tracking configuration
 */
export const careCollectiveErrorConfig = {
  // Platform identification
  platform: 'care-collective',
  version: process.env.npm_package_version || '1.0.0',

  // Error classification for mutual aid platform
  severityLevels: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  } as const,

  // Care Collective specific error tags
  defaultTags: {
    platform: 'care-collective',
    environment: config.NODE_ENV,
    deployment: process.env.VERCEL_ENV || 'local'
  },

  // Error categories specific to mutual aid platform
  errorCategories: {
    UI_ERROR: 'ui_error',
    API_ERROR: 'api_error',
    DATABASE_ERROR: 'database_error',
    AUTH_ERROR: 'auth_error',
    MESSAGING_ERROR: 'messaging_error',
    CONTACT_EXCHANGE_ERROR: 'contact_exchange_error',
    HELP_REQUEST_ERROR: 'help_request_error',
    ADMIN_ERROR: 'admin_error',
    SECURITY_ERROR: 'security_error',
    PERFORMANCE_ERROR: 'performance_error'
  } as const,

  // Privacy-safe context extraction for mutual aid platform
  sanitizeContext: (context: Record<string, any>) => {
    const sensitive_keys = [
      'email', 'phone', 'address', 'contact_info', 'password',
      'token', 'session', 'private_key', 'api_key'
    ]

    const sanitized = { ...context }

    for (const key of sensitive_keys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }

    // Remove any contact exchange data to protect user privacy
    if (sanitized.contact_exchange) {
      sanitized.contact_exchange = '[REDACTED_CONTACT_DATA]'
    }

    return sanitized
  },

  // Determine if error tracking is enabled and properly configured
  isEnabled: () => {
    if (!config.ENABLE_ERROR_TRACKING) {
      return false
    }

    // In production, require either Sentry or custom endpoint
    if (config.NODE_ENV === 'production') {
      return !!(config.NEXT_PUBLIC_SENTRY_DSN || config.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT)
    }

    // In development, always enabled for testing
    return true
  },

  // Get appropriate error tracking service configuration
  getServiceConfig: () => {
    if (config.NEXT_PUBLIC_SENTRY_DSN) {
      return {
        type: 'sentry',
        dsn: config.NEXT_PUBLIC_SENTRY_DSN,
        org: config.SENTRY_ORG,
        project: config.SENTRY_PROJECT,
        authToken: config.SENTRY_AUTH_TOKEN
      }
    }

    if (config.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
      return {
        type: 'custom',
        endpoint: config.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT,
        apiKey: config.ERROR_TRACKING_API_KEY
      }
    }

    return {
      type: 'development',
      endpoint: null
    }
  }
}

export type ErrorCategory = keyof typeof careCollectiveErrorConfig.errorCategories
export type SeverityLevel = keyof typeof careCollectiveErrorConfig.severityLevels