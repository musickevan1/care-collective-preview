import { NextRequest, NextResponse } from 'next/server'

/**
 * API Cache utility for optimizing response times
 */

interface CacheConfig {
  maxAge?: number
  staleWhileRevalidate?: number
  cachePrivate?: boolean
  mustRevalidate?: boolean
}

/**
 * Apply caching headers to API responses
 */
export function withCaching(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    
    const {
      maxAge = 300, // 5 minutes default
      staleWhileRevalidate = 60,
      cachePrivate = false,
      mustRevalidate = false
    } = config

    // Don't cache error responses
    if (response.status >= 400) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }

    // Build cache control header
    const cacheControl = [
      cachePrivate ? 'private' : 'public',
      `max-age=${maxAge}`,
      staleWhileRevalidate > 0 ? `stale-while-revalidate=${staleWhileRevalidate}` : '',
      mustRevalidate ? 'must-revalidate' : ''
    ].filter(Boolean).join(', ')

    response.headers.set('Cache-Control', cacheControl)
    
    // Add ETag for better cache validation
    const etag = generateETag(response)
    if (etag) {
      response.headers.set('ETag', etag)
    }

    return response
  }
}

/**
 * Cache configuration presets for common use cases
 */
export const CachePresets = {
  // Static data that rarely changes (user profiles, settings)
  STATIC: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 300, // 5 minutes
    cachePrivate: false
  },
  
  // Dynamic data that changes frequently (help requests, notifications)
  DYNAMIC: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30, // 30 seconds
    cachePrivate: false
  },
  
  // Private user data (dashboard, personal requests)
  PRIVATE: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    cachePrivate: true
  },
  
  // Real-time data (chat, live updates)
  REALTIME: {
    maxAge: 0,
    staleWhileRevalidate: 0,
    cachePrivate: true,
    mustRevalidate: true
  }
}

/**
 * Generate ETag for response content
 */
function generateETag(response: NextResponse): string | null {
  try {
    const content = response.body
    if (!content) return null
    
    // Simple hash for ETag - in production, use a more robust solution
    let hash = 0
    const str = content.toString()
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `"${Math.abs(hash).toString(36)}"`
  } catch {
    return null
  }
}

/**
 * Memory cache for frequently accessed data
 */
class MemoryCache {
  private cache = new Map<string, { data: any, expiry: number }>()
  private maxSize = 100 // Maximum number of cached items
  
  set(key: string, data: any, ttlMs: number = 60000) {
    // Clear expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

/**
 * Wrapper for cached API calls
 */
export async function withMemoryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  // Try to get from cache first
  const cached = memoryCache.get(key)
  if (cached) {
    return cached
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Cache the result
  memoryCache.set(key, data, ttlMs)
  
  return data
}

/**
 * Conditional request handling (ETag/If-None-Match)
 */
export function handleConditionalRequest(
  req: NextRequest,
  response: NextResponse
): NextResponse | null {
  const ifNoneMatch = req.headers.get('if-none-match')
  const etag = response.headers.get('etag')
  
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    // Content hasn't changed, return 304
    return new NextResponse(null, { status: 304 })
  }
  
  return null
}