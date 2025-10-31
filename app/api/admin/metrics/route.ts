import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get community health metrics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Try to get cached metrics from materialized view first
    let { data: cachedMetrics, error: cacheError } = await supabase
      .from('community_health_metrics')
      .select('*')
      .limit(1)
      .single()

    // If cached metrics are older than 5 minutes, refresh them
    const shouldRefresh = !cachedMetrics ||
      !cachedMetrics.last_updated ||
      (new Date().getTime() - new Date(cachedMetrics.last_updated).getTime()) > 5 * 60 * 1000

    if (shouldRefresh) {
      try {
        // Refresh the materialized view
        await supabase.rpc('refresh_community_health_metrics')

        // Get the updated metrics
        const { data: refreshedMetrics } = await supabase
          .from('community_health_metrics')
          .select('*')
          .limit(1)
          .single()

        cachedMetrics = refreshedMetrics
      } catch (refreshError) {
        console.error('Failed to refresh metrics, using cached data:', refreshError)
      }
    }

    // If we still don't have metrics, calculate them directly
    if (!cachedMetrics) {
      console.log('Calculating metrics directly from database...')

      const [
        usersResult,
        helpRequestsResult,
        messagesResult,
        reportsResult
      ] = await Promise.all([
        // User metrics
        supabase
          .from('profiles')
          .select('id, verification_status, created_at', { count: 'exact' }),

        // Help request metrics
        supabase
          .from('help_requests')
          .select('id, status, created_at, closed_at', { count: 'exact' }),

        // Message metrics
        supabase
          .from('messages')
          .select('id, created_at', { count: 'exact' }),

        // Report metrics
        supabase
          .from('message_reports')
          .select('id, status', { count: 'exact' })
      ])

      if (usersResult.error || helpRequestsResult.error || messagesResult.error || reportsResult.error) {
        throw new Error('Failed to fetch metrics data')
      }

      const users = usersResult.data || []
      const helpRequests = helpRequestsResult.data || []
      const messages = messagesResult.data || []
      const reports = reportsResult.data || []

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Calculate metrics manually
      const totalUsers = users.length
      const activeUsers = users.filter(u => u.verification_status === 'approved').length
      const pendingUsers = users.filter(u => u.verification_status === 'pending').length
      const newUsers30d = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length

      const totalHelpRequests = helpRequests.length
      const openRequests = helpRequests.filter(r => r.status === 'open').length
      const completedRequests = helpRequests.filter(r => r.status === 'closed').length
      const newRequests7d = helpRequests.filter(r => new Date(r.created_at) >= sevenDaysAgo).length

      const totalMessages = messages.length
      const messages24h = messages.filter(m => new Date(m.created_at) >= twentyFourHoursAgo).length

      const totalReports = reports.length
      const pendingReports = reports.filter(r => r.status === 'pending').length

      // Calculate average resolution time
      const closedRequests = helpRequests.filter(r => r.status === 'closed' && r.closed_at)
      const avgResolutionHours = closedRequests.length > 0
        ? closedRequests.reduce((sum, r) => {
            const resolutionTime = new Date(r.closed_at).getTime() - new Date(r.created_at).getTime()
            return sum + (resolutionTime / (1000 * 60 * 60)) // Convert to hours
          }, 0) / closedRequests.length
        : 0

      cachedMetrics = {
        total_users: totalUsers,
        active_users: activeUsers,
        pending_users: pendingUsers,
        new_users_30d: newUsers30d,
        total_help_requests: totalHelpRequests,
        open_requests: openRequests,
        completed_requests: completedRequests,
        new_requests_7d: newRequests7d,
        total_messages: totalMessages,
        messages_24h: messages24h,
        total_reports: totalReports,
        pending_reports: pendingReports,
        avg_resolution_hours: Math.round(avgResolutionHours * 100) / 100,
        last_updated: now.toISOString()
      }
    }

    // Additional real-time metrics that don't need caching
    const { data: emailNotifications } = await supabase
      .from('email_notifications')
      .select('delivery_status')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const emailMetrics = {
      emails_sent_24h: emailNotifications?.length || 0,
      emails_delivered_24h: emailNotifications?.filter(e => e.delivery_status === 'delivered').length || 0,
      email_failure_rate: (emailNotifications?.length ?? 0) > 0 && emailNotifications
        ? Math.round((emailNotifications.filter(e => ['failed', 'bounced'].includes(e.delivery_status)).length / emailNotifications.length) * 100)
        : 0
    }

    return NextResponse.json({
      metrics: {
        ...cachedMetrics,
        ...emailMetrics
      }
    })

  } catch (error) {
    console.error('[Admin API] Metrics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Refresh metrics manually
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Force refresh of materialized view
    const { error: refreshError } = await supabase.rpc('refresh_community_health_metrics')

    if (refreshError) {
      console.error('[Admin API] Error refreshing metrics:', refreshError)
      return NextResponse.json({ error: 'Failed to refresh metrics' }, { status: 500 })
    }

    console.log(`[Admin API] Metrics refreshed by admin ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Metrics refreshed successfully',
      refreshed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Admin API] Metrics POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}