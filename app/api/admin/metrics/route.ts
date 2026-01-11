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

    // If we still don't have metrics, calculate them using efficient count queries
    if (!cachedMetrics) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

      // Use efficient count queries with database-level filtering
      const [
        totalUsersResult,
        activeUsersResult,
        pendingUsersResult,
        newUsers30dResult,
        totalRequestsResult,
        openRequestsResult,
        completedRequestsResult,
        newRequests7dResult,
        totalMessagesResult,
        messages24hResult,
        totalReportsResult,
        pendingReportsResult
      ] = await Promise.all([
        // User metrics - efficient count queries
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),

        // Help request metrics - efficient count queries
        supabase.from('help_requests').select('id', { count: 'exact', head: true }),
        supabase.from('help_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('help_requests').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('help_requests').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),

        // Message metrics
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', twentyFourHoursAgo),

        // Report metrics
        supabase.from('message_reports').select('id', { count: 'exact', head: true }),
        supabase.from('message_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ])

      cachedMetrics = {
        total_users: totalUsersResult.count || 0,
        active_users: activeUsersResult.count || 0,
        pending_users: pendingUsersResult.count || 0,
        new_users_30d: newUsers30dResult.count || 0,
        total_help_requests: totalRequestsResult.count || 0,
        open_requests: openRequestsResult.count || 0,
        completed_requests: completedRequestsResult.count || 0,
        new_requests_7d: newRequests7dResult.count || 0,
        total_messages: totalMessagesResult.count || 0,
        messages_24h: messages24hResult.count || 0,
        total_reports: totalReportsResult.count || 0,
        pending_reports: pendingReportsResult.count || 0,
        avg_resolution_hours: 0, // Would need a separate query for this
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