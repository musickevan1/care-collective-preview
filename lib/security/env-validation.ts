import { envSchema, productionEnvSchema } from '@/lib/validations'
import { z } from 'zod'

/**
 * Validate environment variables at startup
 * Uses stricter validation in production mode
 */
export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const schema = isProduction ? productionEnvSchema : envSchema

  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }

    schema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const level = isProduction ? 'error' : 'warn'
      console[level](`Environment validation issues (${isProduction ? 'PRODUCTION' : 'development'}):`)
      error.issues.forEach((err: z.ZodIssue) => {
        console[level](`  - ${err.path.join('.')}: ${err.message}`)
      })

      // Only exit in production for critical failures
      if (isProduction) {
        process.exit(1)
      }
    } else {
      console.error('Environment validation error:', error)
      if (isProduction) {
        process.exit(1)
      }
    }
  }
}

/**
 * Get validated environment configuration
 */
export function getValidatedEnv() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  }

  return envSchema.parse(env)
}

/**
 * Check for common security misconfigurations
 * Returns warnings and errors for the caller to handle
 */
export function checkSecurityConfig(): { warnings: string[]; errors: string[] } {
  const warnings: string[] = []
  const errors: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Production-critical checks
  if (isProduction) {
    // Critical: Service role key needed for admin functions
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production for admin functions')
    }

    // Debug mode in production
    if (process.env.DEBUG === 'true') {
      errors.push('DEBUG mode must not be enabled in production')
    }

    // Development URLs in production
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1')) {
      errors.push('Cannot use localhost Supabase URL in production')
    }

    // Weak keys check
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anonKey && anonKey.length < 100) {
      errors.push('Supabase anon key appears invalid (too short)')
    }
  }

  // Recommended but not critical
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY not set - email notifications will not work')
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    warnings.push('NEXT_PUBLIC_SENTRY_DSN not set - error tracking will not work')
  }

  if (!process.env.REDIS_URL && isProduction) {
    warnings.push('REDIS_URL not set - rate limiting will use in-memory store (not recommended for production)')
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Environment configuration warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  // Log and handle errors
  if (errors.length > 0) {
    console.error('❌ Critical environment configuration errors:')
    errors.forEach(error => console.error(`  - ${error}`))

    if (isProduction) {
      console.error('Exiting due to critical configuration errors in production')
      process.exit(1)
    }
  }

  return { warnings, errors }
}

/**
 * Sanitize environment variables for logging
 */
export function sanitizeEnvForLogging(): Record<string, string> {
  const env = process.env
  const sanitized: Record<string, string> = {}

  Object.keys(env).forEach(key => {
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
      sanitized[key] = '[REDACTED]'
    } else if (key.includes('PASSWORD') || key.includes('PASS')) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = env[key] || ''
    }
  })

  return sanitized
}

/**
 * Initialize environment validation
 * Call this at application startup to validate all environment configuration
 */
export function initializeEnvironment(): { valid: boolean; warnings: string[]; errors: string[] } {
  // Validate environment variables
  validateEnvironment()

  // Check security configuration
  const { warnings, errors } = checkSecurityConfig()

  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}