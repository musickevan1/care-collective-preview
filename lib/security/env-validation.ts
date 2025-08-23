import { envSchema } from '@/lib/validations'
import { z } from 'zod'

/**
 * Validate environment variables at startup
 */
export function validateEnvironment(): void {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }

    envSchema.parse(env)
    
    console.log('✅ Environment validation passed')
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.issues.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment validation error:', error)
    }
    
    process.exit(1)
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
 */
export function checkSecurityConfig(): void {
  const warnings: string[] = []

  // Check if in production
  if (process.env.NODE_ENV === 'production') {
    // Warn about debug flags
    if (process.env.DEBUG === 'true') {
      warnings.push('DEBUG mode is enabled in production')
    }

    // Check for development URLs in production
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1')) {
      warnings.push('Using localhost Supabase URL in production')
    }

    // Check for weak keys (basic check)
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anonKey && anonKey.length < 100) {
      warnings.push('Supabase anon key appears to be too short')
    }
  }

  // Check for missing security environment variables
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not set (may be needed for admin functions)')
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Security configuration warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
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
 */
export function initializeEnvironment(): void {
  console.log('🔧 Initializing environment validation...')
  
  validateEnvironment()
  checkSecurityConfig()
  
  console.log('✅ Environment initialization complete')
}