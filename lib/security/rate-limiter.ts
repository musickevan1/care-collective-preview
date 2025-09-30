import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * Rate Limiter with Vercel KV (Redis) backing
 * Falls back to in-memory storage in development
 *
 * Phase 3.2 Enhancement: Production-ready distributed rate limiting
 */

// In-memory fallback for development (when KV is not available)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

interface RateLimitResult {
  success: boolean
  reset: number
  remaining: number
  total: number
}

interface RateLimitData {
  count: number
  resetTime: number
}

/**
 * Rate limiter implementation for Next.js API routes
 * Uses Vercel KV (Redis) in production, falls back to in-memory in development
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>
  private useKV: boolean

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      ...config,
    }

    // Check if KV is available (production)
    this.useKV = process.env.NODE_ENV === 'production' && !!process.env.KV_REST_API_URL

    if (!this.useKV && process.env.NODE_ENV === 'production') {
      console.warn('[Rate Limiter] KV_REST_API_URL not found. Falling back to in-memory storage. This will not scale across multiple instances.')
    }
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest, identifier?: string): Promise<RateLimitResult> {
    const key = this.getIdentifier(request, identifier)
    const now = Date.now()

    if (this.useKV) {
      return this.checkWithKV(key, now)
    } else {
      return this.checkInMemory(key, now)
    }
  }

  /**
   * Check rate limit using Vercel KV (Redis)
   */
  private async checkWithKV(key: string, now: number): Promise<RateLimitResult> {
    try {
      const rateLimitKey = `ratelimit:${key}`

      // Get current count from KV
      const current = await kv.get<RateLimitData>(rateLimitKey)

      if (!current || current.resetTime <= now) {
        // First request in window or window expired
        const resetTime = now + this.config.windowMs
        const newData: RateLimitData = {
          count: 1,
          resetTime,
        }

        // Set with TTL (convert ms to seconds for Redis)
        await kv.set(rateLimitKey, newData, {
          px: this.config.windowMs, // px = milliseconds expiry
        })

        return {
          success: true,
          reset: resetTime,
          remaining: this.config.max - 1,
          total: this.config.max,
        }
      }

      if (current.count >= this.config.max) {
        // Rate limit exceeded
        return {
          success: false,
          reset: current.resetTime,
          remaining: 0,
          total: this.config.max,
        }
      }

      // Increment counter
      const updatedData: RateLimitData = {
        count: current.count + 1,
        resetTime: current.resetTime,
      }

      // Update with remaining TTL
      const remainingMs = current.resetTime - now
      await kv.set(rateLimitKey, updatedData, {
        px: remainingMs > 0 ? remainingMs : this.config.windowMs,
      })

      return {
        success: true,
        reset: current.resetTime,
        remaining: this.config.max - updatedData.count,
        total: this.config.max,
      }
    } catch (error) {
      console.error('[Rate Limiter] KV error, falling back to in-memory:', error)
      // Fallback to in-memory on KV error
      return this.checkInMemory(key, now)
    }
  }

  /**
   * Check rate limit using in-memory storage (development fallback)
   */
  private checkInMemory(key: string, now: number): RateLimitResult {
    const windowStart = now - this.config.windowMs

    // Clean old entries
    this.cleanup(windowStart)

    const current = requestCounts.get(key)

    if (!current || current.resetTime <= now) {
      // First request in window or window expired
      requestCounts.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      })

      return {
        success: true,
        reset: now + this.config.windowMs,
        remaining: this.config.max - 1,
        total: this.config.max,
      }
    }

    if (current.count >= this.config.max) {
      // Rate limit exceeded
      return {
        success: false,
        reset: current.resetTime,
        remaining: 0,
        total: this.config.max,
      }
    }

    // Increment counter
    current.count++
    requestCounts.set(key, current)

    return {
      success: true,
      reset: current.resetTime,
      remaining: this.config.max - current.count,
      total: this.config.max,
    }
  }

  /**
   * Apply rate limiting to a request and return appropriate response
   */
  async middleware(request: NextRequest, identifier?: string): Promise<NextResponse | null> {
    const result = await this.check(request, identifier)

    if (!result.success) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: this.config.message,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      )

      this.addHeaders(response, result)
      return response
    }

    return null // Continue processing
  }

  /**
   * Add rate limit headers to response
   */
  addHeaders(response: NextResponse, result: RateLimitResult): void {
    if (this.config.standardHeaders) {
      response.headers.set('RateLimit-Limit', result.total.toString())
      response.headers.set('RateLimit-Remaining', result.remaining.toString())
      response.headers.set('RateLimit-Reset', new Date(result.reset).toISOString())
    }

    if (this.config.legacyHeaders) {
      response.headers.set('X-RateLimit-Limit', result.total.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString())
    }
  }

  /**
   * Get unique identifier for rate limiting
   */
  private getIdentifier(request: NextRequest, customId?: string): string {
    if (customId) {
      return `custom:${customId}`
    }

    // Try to get real IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'

    return `ip:${ip}`
  }

  /**
   * Clean up expired entries (in-memory only)
   */
  private cleanup(windowStart: number): void {
    const now = Date.now()
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime <= now) {
        requestCounts.delete(key)
      }
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing)
   */
  async reset(key: string): Promise<void> {
    if (this.useKV) {
      try {
        await kv.del(`ratelimit:${key}`)
      } catch (error) {
        console.error('[Rate Limiter] Failed to reset KV key:', error)
      }
    } else {
      requestCounts.delete(key)
    }
  }

  /**
   * Get current rate limit status for a key
   */
  async getStatus(key: string): Promise<RateLimitData | null> {
    if (this.useKV) {
      try {
        return await kv.get<RateLimitData>(`ratelimit:${key}`)
      } catch (error) {
        console.error('[Rate Limiter] Failed to get KV status:', error)
        return null
      }
    } else {
      return requestCounts.get(key) || null
    }
  }
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.',
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many API requests, please slow down.',
})

export const formRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 form submissions per minute
  message: 'Too many form submissions, please wait before trying again.',
})

export const strictRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Rate limit exceeded for sensitive operations.',
})

// Care Collective specific rate limiters for mutual aid platform
export const contactExchangeRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact exchanges per hour per user
  message: 'Too many contact exchange requests. Please wait before trying again to prevent abuse.',
})

export const helpRequestRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 help requests per hour
  message: 'Too many help requests. Please wait before creating another request.',
})

export const messageRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: 'Too many messages sent. Please slow down to maintain a respectful conversation.',
})

export const reportRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reports per hour
  message: 'Too many reports submitted. Please wait before submitting another report.',
})

export const adminActionRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 admin actions per minute for efficiency
  message: 'Admin action rate limit exceeded. Please pace your administrative actions.',
})

/**
 * Higher-order function to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = apiRateLimiter,
  getIdentifier?: (req: NextRequest) => string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getIdentifier?.(request)
    const rateLimitResponse = await limiter.middleware(request, identifier)

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    try {
      const response = await handler(request)

      // Add rate limit headers to successful responses
      const result = await limiter.check(request, identifier)
      limiter.addHeaders(response, result)

      return response
    } catch (error) {
      console.error('API handler error:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Get user-specific rate limiter identifier
 */
export function getUserIdentifier(request: NextRequest, userId?: string): string | undefined {
  if (userId) {
    return `user:${userId}`
  }

  // Could extract user ID from JWT token or session
  // For now, fall back to IP-based limiting
  return undefined
}