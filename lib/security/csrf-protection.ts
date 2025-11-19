import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * CSRF Protection for Care Collective
 * Implements token-based CSRF protection for API routes
 */

interface CSRFConfig {
  secret?: string
  tokenLength?: number
  cookieName?: string
  headerName?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
  maxAge?: number
}

export class CSRFProtection {
  private secret: string
  private tokenLength: number
  private cookieName: string
  private headerName: string
  private sameSite: 'strict' | 'lax' | 'none'
  private secure: boolean
  private maxAge: number

  constructor(config: CSRFConfig = {}) {
    this.secret = config.secret || process.env.CSRF_SECRET || 'care-collective-csrf-secret'
    this.tokenLength = config.tokenLength || 32
    this.cookieName = config.cookieName || 'csrf-token'
    this.headerName = config.headerName || 'x-csrf-token'
    this.sameSite = config.sameSite || 'lax'
    this.secure = config.secure ?? (process.env.NODE_ENV === 'production')
    this.maxAge = config.maxAge || 3600000 // 1 hour
  }

  /**
   * Generate a CSRF token
   */
  generateToken(sessionId?: string): string {
    const payload = sessionId || crypto.randomUUID()
    const timestamp = Date.now().toString()
    const data = `${payload}:${timestamp}`
    
    const hash = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex')
    
    return Buffer.from(`${data}:${hash}`).toString('base64url')
  }

  /**
   * Verify a CSRF token
   */
  verifyToken(token: string, sessionId?: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8')
      const parts = decoded.split(':')
      
      if (parts.length !== 3) return false
      
      const [payload, timestamp, hash] = parts
      const data = `${payload}:${timestamp}`
      
      // Verify hash
      const expectedHash = crypto
        .createHmac('sha256', this.secret)
        .update(data)
        .digest('hex')
      
      if (hash !== expectedHash) return false
      
      // Check expiration (token valid for maxAge milliseconds)
      const tokenTime = parseInt(timestamp)
      const now = Date.now()
      
      if (now - tokenTime > this.maxAge) return false
      
      // Verify session match if provided
      if (sessionId && payload !== sessionId) return false
      
      return true
    } catch (error) {
      console.error('[CSRF] Token verification error:', error)
      return false
    }
  }

  /**
   * Extract CSRF token from request headers or cookies
   */
  extractToken(request: NextRequest): string | null {
    // Check header first
    const headerToken = request.headers.get(this.headerName)
    if (headerToken) return headerToken

    // Check cookie
    const cookieToken = request.cookies.get(this.cookieName)?.value
    if (cookieToken) return cookieToken

    return null
  }

  /**
   * Validate CSRF token for API request
   */
  validateRequest(request: NextRequest, sessionId?: string): boolean {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true
    }

    // Skip CSRF in development mode (for testing)
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_CSRF === 'true') {
      return true
    }

    const token = this.extractToken(request)
    if (!token) {
      console.warn('[CSRF] No token provided in request')
      return false
    }

    const isValid = this.verifyToken(token, sessionId)
    if (!isValid) {
      console.warn('[CSRF] Token validation failed')
    }

    return isValid
  }

  /**
   * Get cookie options for CSRF token
   */
  getCookieOptions() {
    return {
      name: this.cookieName,
      options: {
        httpOnly: true,
        secure: this.secure,
        sameSite: this.sameSite,
        maxAge: this.maxAge / 1000, // Convert to seconds
        path: '/'
      }
    }
  }
}

// Content Security Policy helpers
export class CSPBuilder {
  private directives: Map<string, string[]> = new Map()

  constructor() {
    // Default secure CSP for Care Collective
    this.directives.set('default-src', ["'self'"])
    this.directives.set('script-src', ["'self'", "'unsafe-inline'", "'unsafe-eval'"])
    this.directives.set('style-src', ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'])
    this.directives.set('font-src', ["'self'", 'fonts.gstatic.com'])
    this.directives.set('img-src', ["'self'", 'data:', 'blob:', '*.supabase.co'])
    this.directives.set('connect-src', ["'self'", '*.supabase.co', 'api.resend.com'])
    this.directives.set('frame-ancestors', ["'none'"])
    this.directives.set('base-uri', ["'self'"])
    this.directives.set('form-action', ["'self'"])
  }

  addDirective(directive: string, sources: string[]): CSPBuilder {
    this.directives.set(directive, sources)
    return this
  }

  addSource(directive: string, source: string): CSPBuilder {
    const existing = this.directives.get(directive) || []
    if (!existing.includes(source)) {
      existing.push(source)
      this.directives.set(directive, existing)
    }
    return this
  }

  build(): string {
    const policies: string[] = []
    
    for (const [directive, sources] of this.directives) {
      policies.push(`${directive} ${sources.join(' ')}`)
    }
    
    return policies.join('; ')
  }
}

// Rate limiting with sliding window
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || []
    
    // Remove expired requests
    requests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if under limit
    if (requests.length >= this.maxRequests) {
      return false
    }
    
    // Add current request
    requests.push(now)
    this.requests.set(identifier, requests)
    
    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier)
    } else {
      this.requests.clear()
    }
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart)
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

// Security headers utility
export function getSecurityHeaders(): Record<string, string> {
  const csp = new CSPBuilder().build()
  
  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

// Export singleton instances
export const csrfProtection = new CSRFProtection()
export const rateLimiter = new RateLimiter()

const securityUtils = {
  CSRFProtection,
  CSPBuilder,
  RateLimiter,
  getSecurityHeaders,
  csrfProtection,
  rateLimiter
}

export default securityUtils