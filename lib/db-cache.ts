import { createClient } from './supabase/server'
import { memoryCache } from './api-cache'

/**
 * Database Query Cache for Supabase
 * Provides caching layer for frequently accessed data
 */

interface CacheConfig {
  ttl?: number
  key?: string
  skipCache?: boolean
}

/**
 * Cached query executor with automatic cache invalidation
 */
export async function cachedQuery<T>(
  queryFn: () => Promise<{ data: T | null, error: any }>,
  config: CacheConfig = {}
): Promise<{ data: T | null, error: any }> {
  const {
    ttl = 60000, // 1 minute default
    key,
    skipCache = false
  } = config

  // Generate cache key if not provided
  const cacheKey = key || `query_${Buffer.from(queryFn.toString()).toString('base64').slice(0, 20)}`

  // Skip cache if requested or in development
  if (skipCache || process.env.NODE_ENV === 'development') {
    return await queryFn()
  }

  // Try to get from cache
  const cached = memoryCache.get(cacheKey)
  if (cached && !cached.error) {
    return cached
  }

  // Execute query
  const result = await queryFn()
  
  // Cache successful results only
  if (result.data && !result.error) {
    memoryCache.set(cacheKey, result, ttl)
  }

  return result
}

/**
 * Pre-built cached queries for common operations
 */
export class OptimizedQueries {
  private static supabase: Awaited<ReturnType<typeof createClient>> | null = null

  private static getClient() {
    if (!this.supabase) {
      this.supabase = createClient()
    }
    return this.supabase!
  }

  /**
   * Get user profile with caching
   */
  static async getUserProfile(userId: string) {
    return cachedQuery(
      async () => {
        const supabase = this.getClient()
        return supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      },
      { 
        key: `profile_${userId}`,
        ttl: 300000 // 5 minutes
      }
    )
  }

  /**
   * Get help requests with optimized query and caching
   */
  static async getHelpRequests(filters: {
    status?: string
    category?: string
    limit?: number
    userId?: string
  } = {}) {
    const { status, category, limit = 20, userId } = filters
    
    return cachedQuery(
      async () => {
        const supabase = this.getClient()
        
        let query = supabase
          .from('help_requests')
          .select(`
            id,
            title,
            description,
            category,
            urgency,
            status,
            created_at,
            updated_at,
            profiles!user_id (
              id,
              name,
              location
            ),
            helper:profiles!helper_id (
              id,
              name
            )
          `)
        
        if (status) query = query.eq('status', status)
        if (category) query = query.eq('category', category)
        if (userId) query = query.eq('user_id', userId)
        
        return query
          .order('created_at', { ascending: false })
          .limit(limit)
      },
      {
        key: `help_requests_${JSON.stringify(filters)}`,
        ttl: 60000 // 1 minute for dynamic data
      }
    )
  }

  /**
   * Get help request statistics with caching
   */
  static async getHelpRequestStats() {
    return cachedQuery(
      async () => {
        const supabase = this.getClient()
        
        const [
          totalResult,
          openResult,
          inProgressResult,
          completedResult
        ] = await Promise.all([
          supabase!.from('help_requests').select('*', { count: 'exact', head: true }),
          supabase!.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabase!.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
          supabase!.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed')
        ])

        return {
          data: {
            total: totalResult.count || 0,
            open: openResult.count || 0,
            inProgress: inProgressResult.count || 0,
            completed: completedResult.count || 0
          },
          error: null
        }
      },
      {
        key: 'help_request_stats',
        ttl: 120000 // 2 minutes
      }
    )
  }

  /**
   * Get user statistics with caching
   */
  static async getUserStats() {
    return cachedQuery(
      async () => {
        const supabase = this.getClient()
        
        const result = await supabase!
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        return {
          data: { total: result.count || 0 },
          error: result.error
        }
      },
      {
        key: 'user_stats',
        ttl: 300000 // 5 minutes
      }
    )
  }

  /**
   * Invalidate cache for specific patterns
   */
  static invalidateCache(pattern: string | string[]) {
    const patterns = Array.isArray(pattern) ? pattern : [pattern]
    
    patterns.forEach(p => {
      memoryCache.delete(p)
      
      // Also clear related patterns (basic pattern matching)
      if (p.includes('help_requests')) {
        memoryCache.delete('help_request_stats')
      }
      if (p.includes('profile')) {
        memoryCache.delete('user_stats')
      }
    })
  }

  /**
   * Clear all cached queries
   */
  static clearCache() {
    memoryCache.clear()
  }
}

/**
 * Database connection pool manager for better performance
 */
export class ConnectionManager {
  private static connections = new Map<string, any>()
  
  static getConnection(key: string = 'default') {
    if (!this.connections.has(key)) {
      const supabase = createClient()
      this.connections.set(key, supabase)
    }
    return this.connections.get(key)
  }
  
  static closeConnection(key: string = 'default') {
    this.connections.delete(key)
  }
  
  static closeAllConnections() {
    this.connections.clear()
  }
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Batch multiple queries for better performance
   */
  static async batchQueries<T extends Record<string, () => Promise<any>>>(
    queries: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const entries = Object.entries(queries)
    const results = await Promise.all(entries.map(([, query]) => query()))
    
    return entries.reduce((acc, [key], index) => {
      acc[key as keyof T] = results[index]
      return acc
    }, {} as any)
  }

  /**
   * Paginated query with cursor optimization
   */
  static async paginatedQuery<T>(
    baseQuery: any,
    cursor?: string,
    pageSize: number = 20
  ) {
    let query = baseQuery.limit(pageSize + 1) // Get one extra to check if there's more
    
    if (cursor) {
      query = query.gt('created_at', cursor)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) return { data: null, error }
    
    const hasMore = data.length > pageSize
    const items = hasMore ? data.slice(0, pageSize) : data
    const nextCursor = hasMore ? items[items.length - 1]?.created_at : null
    
    return {
      data: {
        items,
        nextCursor,
        hasMore
      },
      error: null
    }
  }
}

/**
 * Real-time subscriptions with caching
 */
export class RealtimeCache {
  private static subscriptions = new Map<string, any>()
  
  static subscribe(table: string, callback: (data: any) => void) {
    if (this.subscriptions.has(table)) {
      return this.subscriptions.get(table)
    }
    
    // This would integrate with Supabase real-time
    // For now, we'll use polling as a fallback
    const interval = setInterval(async () => {
      // Invalidate relevant caches when data might have changed
      OptimizedQueries.invalidateCache([
        `${table}_`,
        'help_request_stats',
        'user_stats'
      ])
    }, 30000) // 30 seconds
    
    this.subscriptions.set(table, interval)
    return interval
  }
  
  static unsubscribe(table: string) {
    const subscription = this.subscriptions.get(table)
    if (subscription) {
      clearInterval(subscription)
      this.subscriptions.delete(table)
    }
  }
  
  static unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      clearInterval(subscription)
    })
    this.subscriptions.clear()
  }
}