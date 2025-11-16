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
  subcategory?: string | null
  urgency: string
  status: string
  created_at: string
  user_id: string
  helper_id: string | null
  location_override?: string | null
  location_privacy?: string | null
  exchange_offer?: string | null
  // Nested profiles from foreign key join (RLS now fixed)
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
 * Uses separate queries to work around RLS foreign key join limitations
 *
 * BACKGROUND: Foreign key joins with RLS policies don't always work as expected.
 * Even with correct policies, Supabase may return null for joined tables.
 * This implementation fetches help requests first, then fetches profiles separately.
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

    // Step 1: Query help_requests table WITHOUT foreign key joins
    let query = supabase
      .from('help_requests')
      .select('*')

    // Apply search filter using ILIKE
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply filters in optimal order for index usage
    // ALWAYS exclude cancelled requests from public board
    if (status !== 'all') {
      query = query.eq('status', status)
    } else {
      // When showing 'all' statuses, exclude cancelled requests
      query = query.neq('status', 'cancelled')
    }

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

    // Apply limit for performance
    query = query.limit(limit)

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      console.error('[Optimized Query] Help requests error:', requestsError)
      return { data: null, error: requestsError }
    }

    if (!requests || requests.length === 0) {
      console.log('[Optimized Query] No help requests found')
      return { data: [], error: null }
    }

    // Step 2: Extract unique user IDs and helper IDs
    const userIds = new Set<string>()
    requests.forEach(req => {
      if (req.user_id) userIds.add(req.user_id)
      if (req.helper_id) userIds.add(req.helper_id)
    })

    console.log('[Optimized Query] Fetching profiles for user IDs:', Array.from(userIds))

    // Step 3: Fetch all needed profiles in a single query
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, location')
      .in('id', Array.from(userIds))

    if (profilesError) {
      console.warn('[Optimized Query] Profiles error (non-fatal):', profilesError)
      // Continue even if profiles fetch fails - we'll use fallback names
    }

    console.log('[Optimized Query] Fetched profiles:', profiles?.length || 0)

    // Step 4: Create a lookup map for fast profile access
    const profileMap = new Map<string, { name: string; location: string | null }>()
    profiles?.forEach(profile => {
      profileMap.set(profile.id, {
        name: profile.name || 'Unknown User',
        location: profile.location
      })
    })

    // Step 5: Merge profiles with help requests
    const mergedData: OptimizedHelpRequest[] = requests.map(req => ({
      ...req,
      profiles: profileMap.get(req.user_id) || {
        name: 'Unknown User',
        location: null
      },
      helper: req.helper_id ? (profileMap.get(req.helper_id) || {
        name: 'Unknown Helper',
        location: null
      }) : null
    }))

    console.log('[Optimized Query] Successfully merged data:', mergedData.length)

    return { data: mergedData, error: null }

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
 * Uses separate queries to work around RLS foreign key join limitations
 */
export async function getUrgentHelpRequests(limit: number = 10): Promise<{
  data: OptimizedHelpRequest[] | null
  error: any
}> {
  try {
    const supabase = await createClient()

    // Step 1: Get urgent/critical help requests
    const { data: requests, error: requestsError } = await supabase
      .from('help_requests')
      .select('*')
      .in('urgency', ['urgent', 'critical'])
      .eq('status', 'open')
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (requestsError) {
      return { data: null, error: requestsError }
    }

    if (!requests || requests.length === 0) {
      return { data: [], error: null }
    }

    // Step 2: Extract unique user IDs
    const userIds = new Set<string>()
    requests.forEach(req => {
      if (req.user_id) userIds.add(req.user_id)
      if (req.helper_id) userIds.add(req.helper_id)
    })

    // Step 3: Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, location')
      .in('id', Array.from(userIds))

    // Step 4: Create profile map
    const profileMap = new Map<string, { name: string; location: string | null }>()
    profiles?.forEach(profile => {
      profileMap.set(profile.id, {
        name: profile.name || 'Unknown User',
        location: profile.location
      })
    })

    // Step 5: Merge data
    const mergedData: OptimizedHelpRequest[] = requests.map(req => ({
      ...req,
      profiles: profileMap.get(req.user_id) || { name: 'Unknown User', location: null },
      helper: req.helper_id ? (profileMap.get(req.helper_id) || { name: 'Unknown Helper', location: null }) : null
    }))

    return { data: mergedData, error: null }

  } catch (error) {
    console.error('[Urgent Requests Query] Exception:', error)
    return { data: null, error }
  }
}