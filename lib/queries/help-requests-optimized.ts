/**
 * @fileoverview Optimized queries for help requests - Phase 3.1 Performance Enhancement
 * Uses compound indexes and full-text search for better performance
 */

import { createClient } from '@/lib/supabase/server'

export interface HelpRequestFilters {
  status?: string
  category?: string
  urgency?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
}

export interface OptimizedHelpRequest {
  id: string
  title: string
  description: string | null
  category: string
  urgency: string
  status: string
  created_at: string
  helper_id: string | null
  profiles: {
    name: string
    location: string | null
  } | null
  helper: {
    name: string
    location: string | null
  } | null
  // For search results
  rank?: number
}

/**
 * Optimized query for browsing help requests
 * Uses compound indexes: idx_help_requests_status_created, idx_help_requests_category_urgency
 */
export async function getOptimizedHelpRequests(
  filters: HelpRequestFilters = {}
): Promise<{ data: OptimizedHelpRequest[] | null; error: any }> {
  const {
    status = 'all',
    category = 'all',
    urgency = 'all',
    search = '',
    sort = 'created_at',
    order = 'desc',
    limit = 100
  } = filters

  try {
    const supabase = await createClient()
    let query

    // Use full-text search when search query provided
    if (search.trim()) {
      // Use the full-text search function (requires database migration)
      // Falls back to ILIKE if function doesn't exist
      try {
        query = supabase.rpc('search_help_requests', {
          search_query: search.trim()
        })

        // Apply additional filters to search results
        if (status !== 'all') {
          query = query.eq('status', status)
        }
        if (category !== 'all') {
          query = query.eq('category', category)
        }
        if (urgency !== 'all') {
          query = query.eq('urgency', urgency)
        }

        // For search, order by rank first, then by created_at
        query = query.order('rank', { ascending: false })
        query = query.order('created_at', { ascending: false })

      } catch (searchError) {
        console.warn('[Optimized Query] Search function not available, falling back to ILIKE')

        // Fallback to ILIKE search with optimized query structure
        query = supabase
          .from('help_requests')
          .select(`
            *,
            profiles!user_id (name, location),
            helper:profiles!helper_id (name, location)
          `)
          .or(`title.ilike.%${search}%,description.ilike.%${search}%`)

        // Apply filters in optimal order for compound index usage
        if (status !== 'all') {
          query = query.eq('status', status)
        }
        if (category !== 'all') {
          query = query.eq('category', category)
        }
        if (urgency !== 'all') {
          query = query.eq('urgency', urgency)
        }

        query = query.order('created_at', { ascending: false })
      }

    } else {
      // Optimized regular query using compound indexes
      query = supabase
        .from('help_requests')
        .select(`
          *,
          profiles!user_id (name, location),
          helper:profiles!helper_id (name, location)
        `)

      // Apply filters in optimal order for index usage
      // Primary compound index: idx_help_requests_status_created
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      // Secondary compound index: idx_help_requests_category_urgency
      if (category !== 'all') {
        query = query.eq('category', category)
      }

      if (urgency !== 'all') {
        query = query.eq('urgency', urgency)
      }

      // Optimized sorting based on available indexes
      const isAscending = order === 'asc'

      if (sort === 'urgency') {
        // Use urgency index with created_at secondary sort
        query = query.order('urgency', { ascending: false })
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'created_at') {
        // Use the status + created_at compound index when status filtered
        query = query.order('created_at', { ascending: isAscending })
      } else {
        // For other sorting, add created_at as secondary sort
        query = query.order(sort, { ascending: isAscending })
        query = query.order('created_at', { ascending: false })
      }
    }

    // Apply limit for performance
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('[Optimized Query] Error:', error)
      return { data: null, error }
    }

    return { data: data as OptimizedHelpRequest[], error: null }

  } catch (error) {
    console.error('[Optimized Query] Exception:', error)
    return { data: null, error }
  }
}

/**
 * Get help request statistics for performance monitoring
 */
export async function getHelpRequestStats(): Promise<{
  data: { total: number; open: number; in_progress: number; completed: number } | null
  error: any
}> {
  try {
    const supabase = await createClient()

    // Use optimized parallel queries
    const [totalResult, openResult, inProgressResult, completedResult] = await Promise.all([
      supabase.from('help_requests').select('id', { count: 'exact' }),
      supabase.from('help_requests').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('help_requests').select('id', { count: 'exact' }).eq('status', 'in_progress'),
      supabase.from('help_requests').select('id', { count: 'exact' }).eq('status', 'completed')
    ])

    const stats = {
      total: totalResult.count || 0,
      open: openResult.count || 0,
      in_progress: inProgressResult.count || 0,
      completed: completedResult.count || 0
    }

    return { data: stats, error: null }

  } catch (error) {
    console.error('[Stats Query] Exception:', error)
    return { data: null, error }
  }
}

/**
 * Get urgent help requests for dashboard
 * Uses partial index: idx_help_requests_urgent
 */
export async function getUrgentHelpRequests(limit: number = 10): Promise<{
  data: OptimizedHelpRequest[] | null
  error: any
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('help_requests')
      .select(`
        *,
        profiles!user_id (name, location),
        helper:profiles!helper_id (name, location)
      `)
      .in('urgency', ['urgent', 'critical'])
      .eq('status', 'open')
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data: data as OptimizedHelpRequest[], error }

  } catch (error) {
    console.error('[Urgent Requests Query] Exception:', error)
    return { data: null, error }
  }
}