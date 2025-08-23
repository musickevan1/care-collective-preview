import { NextRequest, NextResponse } from 'next/server'
import { validateUUID } from '@/lib/validations'

/**
 * Content Security Policy configuration
 */
export function getCSPHeader(): string {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind requires unsafe-inline
    "img-src 'self' data: blob: https://*.supabase.co https://vercel.live",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "media-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    // "worker-src 'self' blob:", // Removed to prevent service worker build issues
    "manifest-src 'self'",
  ]

  return cspDirectives.join('; ')
}

/**
 * Security headers configuration
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', getCSPHeader())
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self)'
  )
  
  // HSTS for HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Prevent caching of sensitive pages
  if (response.url.includes('/admin') || response.url.includes('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

/**
 * CORS configuration for API routes
 */
export function configureCORS(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://care-collective-preview.vercel.app',
    // Add production domains here
  ]

  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-CSRF-Token'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours

  return response
}

/**
 * Validate request parameters for potential injection attacks
 */
export function validateRequestParams(request: NextRequest): { valid: boolean; error?: string } {
  const url = new URL(request.url)
  
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /\.\.\/|\.\.\\/, // Path traversal
    /union.*select/i, // SQL injection
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
  ]

  const fullUrl = request.url
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      return { valid: false, error: 'Suspicious request pattern detected' }
    }
  }

  // Validate UUID parameters
  const pathSegments = url.pathname.split('/')
  for (const segment of pathSegments) {
    // If segment looks like it should be a UUID but isn't valid
    if (segment.length === 36 && segment.includes('-') && !validateUUID(segment)) {
      return { valid: false, error: 'Invalid UUID format' }
    }
  }

  return { valid: true }
}

/**
 * Check for suspicious user agents
 */
export function validateUserAgent(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Block empty user agents and known bot patterns
  const suspiciousPatterns = [
    /^$/,
    /curl/i,
    /wget/i,
    /python/i,
    /bot/i,
    /crawler/i,
    /scanner/i,
    /sqlmap/i,
    /nikto/i,
  ]

  // In development, allow any user agent
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return !suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Comprehensive security middleware
 */
export function securityMiddleware(request: NextRequest): NextResponse | null {
  // Validate user agent
  if (!validateUserAgent(request)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Request blocked' },
      { status: 403 }
    )
  }

  // Validate request parameters
  const paramValidation = validateRequestParams(request)
  if (!paramValidation.valid) {
    return NextResponse.json(
      { error: 'Bad Request', message: paramValidation.error },
      { status: 400 }
    )
  }

  // Check for oversized requests
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return NextResponse.json(
      { error: 'Request Too Large', message: 'Request size exceeds limit' },
      { status: 413 }
    )
  }

  return null // Continue processing
}

/**
 * API error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  error: string = 'Bad Request'
): NextResponse {
  return NextResponse.json({
    error,
    message,
    timestamp: new Date().toISOString(),
  }, { status })
}

/**
 * API success response helper
 */
export function createSuccessResponse(
  data?: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }, { status })
}

/**
 * Sanitize request body for logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth']
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Middleware to log security events
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  details?: any
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    details: sanitizeForLogging(details),
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    console.warn('SECURITY_EVENT:', JSON.stringify(logData))
  } else {
    console.log('Security Event:', logData)
  }
}