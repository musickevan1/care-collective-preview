/**
 * @fileoverview Optimized Database Queries
 * 
 * Addresses Issue #8 from TESTING_ISSUES_AND_FIXES.md - Database Query Optimization
 * Provides efficient, cached queries with selective field fetching
 */

import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

// Type definitions for our queries
type HelpRequest = Database['public']['Tables']['help_requests']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type ContactExchange = Database['public']['Tables']['contact_exchanges']['Row']

interface HelpRequestWithProfile extends Omit<HelpRequest, 'user_id'> {
  profiles: Pick<Profile, 'name' | 'location'>
}

interface HelpRequestFilters {
  status?: 'open' | 'closed' | 'in_progress'
  category?: 'groceries' | 'transport' | 'household' | 'medical' | 'other'
  urgency?: 'normal' | 'urgent' | 'critical'
  location?: string
  limit?: number
  offset?: number
}

/**
 * Optimized query for fetching help requests with minimal required data
 */
export const getHelpRequests = unstable_cache(
  async (filters: HelpRequestFilters = {}): Promise<HelpRequestWithProfile[]> => {
    const supabase = await createClient()
    
    const {
      status = 'open',
      category,
      urgency,
      location,
      limit = 20,
      offset = 0,
    } = filters
    
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
        location,
        profiles!inner (
          name,
          location
        )
      `)
      .eq('status', status)
    
    // Apply filters conditionally
    if (category) {
      query = query.eq('category', category)
    }
    
    if (urgency) {
      query = query.eq('urgency', urgency)
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    // Order by urgency first, then creation date
    query = query
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error('[DB Query] Error fetching help requests:', error)
      throw new Error(`Failed to fetch help requests: ${error.message}`)
    }
    
    return data || []
  },
  ['help-requests'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['help-requests'],
  }
)

/**
 * Optimized query for fetching a single help request with full details
 */
export const getHelpRequestById = unstable_cache(
  async (id: string): Promise<HelpRequestWithProfile | null> => {
    const supabase = createClient()
    
    const { data, error } = await supabase
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
        location,
        user_id,
        profiles!inner (
          id,
          name,
          location,
          created_at
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('[DB Query] Error fetching help request:', error)
      throw new Error(`Failed to fetch help request: ${error.message}`)
    }
    
    return data
  },
  ['help-request-detail'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['help-requests', 'help-request-detail'],
  }
)

/**
 * Get user's own help requests with status counts
 */
export const getUserHelpRequests = unstable_cache(
  async (userId: string): Promise<{
    requests: HelpRequestWithProfile[]
    counts: { open: number; closed: number; in_progress: number }
  }> => {
    const supabase = createClient()
    
    // Get requests
    const { data: requests, error: requestsError } = await supabase
      .from('help_requests')
      .select(`
        id,
        title,
        category,
        urgency,
        status,
        created_at,
        profiles!inner (
          name,
          location
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (requestsError) {
      console.error('[DB Query] Error fetching user requests:', requestsError)
      throw new Error(`Failed to fetch user requests: ${requestsError.message}`)
    }
    
    // Get status counts
    const { data: counts, error: countsError } = await supabase
      .from('help_requests')
      .select('status')
      .eq('user_id', userId)
    
    if (countsError) {
      console.error('[DB Query] Error fetching request counts:', countsError)
      throw new Error(`Failed to fetch request counts: ${countsError.message}`)
    }
    
    // Calculate counts
    const statusCounts = {
      open: counts?.filter(r => r.status === 'open').length || 0,
      closed: counts?.filter(r => r.status === 'closed').length || 0,
      in_progress: counts?.filter(r => r.status === 'in_progress').length || 0,
    }
    
    return {
      requests: requests || [],
      counts: statusCounts,
    }
  },
  ['user-help-requests'],
  {
    revalidate: 120, // Cache for 2 minutes
    tags: ['help-requests', 'user-requests'],
  }
)

/**
 * Optimized contact exchange queries with privacy controls
 */
export const getContactExchanges = unstable_cache(
  async (requestId: string, userId: string): Promise<ContactExchange[]> => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('contact_exchanges')
      .select(`
        id,
        request_id,
        helper_id,
        requester_id,
        status,
        created_at,
        message
      `)
      .eq('request_id', requestId)
      .or(`helper_id.eq.${userId},requester_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[DB Query] Error fetching contact exchanges:', error)
      throw new Error(`Failed to fetch contact exchanges: ${error.message}`)
    }
    
    return data || []
  },
  ['contact-exchanges'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['contact-exchanges'],
  }
)

/**
 * Get recent activity for dashboard
 */
export const getRecentActivity = unstable_cache(
  async (limit: number = 10): Promise<{
    recentRequests: HelpRequestWithProfile[]
    activeExchanges: number
  }> => {
    const supabase = createClient()
    
    // Get recent requests
    const { data: recentRequests, error: requestsError } = await supabase
      .from('help_requests')
      .select(`
        id,
        title,
        category,
        urgency,
        created_at,
        profiles!inner (
          name,
          location
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (requestsError) {
      console.error('[DB Query] Error fetching recent requests:', requestsError)
      throw new Error(`Failed to fetch recent requests: ${requestsError.message}`)
    }
    
    // Get active exchanges count
    const { count: activeExchanges, error: exchangesError } = await supabase
      .from('contact_exchanges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'initiated')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    if (exchangesError) {
      console.error('[DB Query] Error fetching exchanges count:', exchangesError)
    }
    
    return {
      recentRequests: recentRequests || [],
      activeExchanges: activeExchanges || 0,
    }
  },
  ['recent-activity'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['help-requests', 'contact-exchanges', 'dashboard'],
  }
)

/**
 * Search help requests with full-text search capabilities
 */
export const searchHelpRequests = unstable_cache(
  async (query: string, filters: Omit<HelpRequestFilters, 'limit' | 'offset'> = {}): Promise<HelpRequestWithProfile[]> => {
    const supabase = createClient()
    
    const {
      status = 'open',
      category,
      urgency,
      location,
    } = filters
    
    let dbQuery = supabase
      .from('help_requests')
      .select(`
        id,
        title,
        description,
        category,
        urgency,
        status,
        created_at,
        profiles!inner (
          name,
          location
        )
      `)
      .eq('status', status)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }
    
    if (urgency) {
      dbQuery = dbQuery.eq('urgency', urgency)
    }
    
    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`)
    }
    
    const { data, error } = await dbQuery
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('[DB Query] Error searching help requests:', error)
      throw new Error(`Failed to search help requests: ${error.message}`)
    }
    
    return data || []
  },
  ['search-help-requests'],
  {
    revalidate: 120, // Cache for 2 minutes
    tags: ['help-requests', 'search'],
  }
)

/**
 * Get statistics for admin dashboard
 */
export const getStatistics = unstable_cache(
  async (): Promise<{
    totalRequests: number
    openRequests: number
    completedRequests: number
    totalUsers: number
    contactExchanges: number
  }> => {
    const supabase = createClient()
    
    const [
      { count: totalRequests },
      { count: openRequests },
      { count: completedRequests },
      { count: totalUsers },
      { count: contactExchanges },
    ] = await Promise.all([
      supabase.from('help_requests').select('*', { count: 'exact', head: true }),
      supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('contact_exchanges').select('*', { count: 'exact', head: true }),
    ])
    
    return {
      totalRequests: totalRequests || 0,
      openRequests: openRequests || 0,
      completedRequests: completedRequests || 0,
      totalUsers: totalUsers || 0,
      contactExchanges: contactExchanges || 0,
    }
  },
  ['statistics'],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ['statistics', 'admin'],
  }
)

/**
 * Cache invalidation helpers
 */
export const revalidateHelpRequests = () => {
  // This would be called after mutations to invalidate cache
  // Implementation depends on your cache invalidation strategy
}

export const revalidateUserData = (userId: string) => {
  // Invalidate user-specific caches
}

/**
 * Batch operations for better performance
 */
export const batchUpdateHelpRequestStatus = async (
  requestIds: string[],
  status: 'open' | 'closed' | 'in_progress'
): Promise<void> => {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('help_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', requestIds)
  
  if (error) {
    console.error('[DB Query] Error batch updating requests:', error)
    throw new Error(`Failed to batch update requests: ${error.message}`)
  }
}

/**
 * Cleanup old data for performance
 */
export const cleanupOldData = async (): Promise<void> => {
  const supabase = createClient()
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
  
  // Clean up old closed requests
  const { error } = await supabase
    .from('help_requests')
    .delete()
    .eq('status', 'closed')
    .lt('updated_at', sixMonthsAgo)
  
  if (error) {
    console.error('[DB Query] Error cleaning up old data:', error)
  }
}