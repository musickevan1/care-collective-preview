import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { errorTracker } from '@/lib/error-tracking'

// GET - Get admin dashboard statistics
export async function GET() {
  try {
    const supabase = createClient()
    
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

    // Get comprehensive statistics
    const [
      usersResult,
      helpRequestsResult,
      pendingApplicationsResult,
      recentActivityResult
    ] = await Promise.all([
      // User statistics
      supabase
        .from('profiles')
        .select('verification_status, is_admin, created_at')
        .then(result => {
          if (result.error) throw result.error
          const users = result.data
          return {
            total: users.length,
            approved: users.filter(u => u.verification_status === 'approved').length,
            pending: users.filter(u => u.verification_status === 'pending').length,
            rejected: users.filter(u => u.verification_status === 'rejected').length,
            admins: users.filter(u => u.is_admin).length,
            newThisWeek: users.filter(u => {
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return new Date(u.created_at) > weekAgo
            }).length
          }
        }),

      // Help request statistics
      supabase
        .from('help_requests')
        .select('status, urgency, created_at, helper_id')
        .then(result => {
          if (result.error) throw result.error
          const requests = result.data
          return {
            total: requests.length,
            open: requests.filter(r => r.status === 'open').length,
            inProgress: requests.filter(r => r.status === 'in_progress').length,
            completed: requests.filter(r => r.status === 'completed').length,
            cancelled: requests.filter(r => r.status === 'cancelled').length,
            urgent: requests.filter(r => r.urgency === 'urgent').length,
            critical: requests.filter(r => r.urgency === 'critical').length,
            newThisWeek: requests.filter(r => {
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return new Date(r.created_at) > weekAgo
            }).length,
            helpedThisWeek: requests.filter(r => {
              if (!r.helper_id) return false
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return new Date(r.created_at) > weekAgo
            }).length
          }
        }),

      // Pending applications
      supabase
        .from('profiles')
        .select('id, name, applied_at')
        .eq('verification_status', 'pending')
        .order('applied_at', { ascending: true })
        .limit(5),

      // Recent activity (last 10 help requests)
      supabase
        .from('help_requests')
        .select(`
          id,
          title,
          category,
          urgency,
          status,
          created_at,
          profiles!user_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Handle any errors with structured logging
    if (pendingApplicationsResult.error) {
      logger.error('Admin stats pending applications query failed', pendingApplicationsResult.error, {
        endpoint: '/api/admin/stats',
        query: 'pending_applications',
        userId: user.id,
        category: 'database_error'
      })

      errorTracker.captureError(pendingApplicationsResult.error, {
        component: 'AdminStatsAPI',
        action: 'fetch_pending_applications',
        severity: 'medium',
        userId: user.id,
        tags: {
          endpoint: '/api/admin/stats',
          query_type: 'pending_applications'
        }
      })
    }

    if (recentActivityResult.error) {
      logger.error('Admin stats recent activity query failed', recentActivityResult.error, {
        endpoint: '/api/admin/stats',
        query: 'recent_activity',
        userId: user.id,
        category: 'database_error'
      })

      errorTracker.captureError(recentActivityResult.error, {
        component: 'AdminStatsAPI',
        action: 'fetch_recent_activity',
        severity: 'medium',
        userId: user.id,
        tags: {
          endpoint: '/api/admin/stats',
          query_type: 'recent_activity'
        }
      })
    }

    // Calculate platform health score (0-100)
    const totalUsers = usersResult.total
    const activeUsers = usersResult.approved
    const totalRequests = helpRequestsResult.total
    const completedRequests = helpRequestsResult.completed
    const openRequests = helpRequestsResult.open
    const criticalRequests = helpRequestsResult.critical

    let healthScore = 100

    // Deduct points for issues
    if (totalUsers > 0) {
      const approvalRate = activeUsers / totalUsers
      if (approvalRate < 0.8) healthScore -= 20 // Low approval rate
    }

    if (totalRequests > 0) {
      const completionRate = completedRequests / totalRequests
      if (completionRate < 0.6) healthScore -= 15 // Low completion rate
    }

    if (criticalRequests > 0) {
      healthScore -= Math.min(criticalRequests * 5, 30) // Critical requests pending
    }

    if (openRequests > 20) {
      healthScore -= 10 // Too many open requests
    }

    const stats = {
      users: usersResult,
      helpRequests: helpRequestsResult,
      pendingApplications: {
        count: usersResult.pending,
        recent: pendingApplicationsResult.data || []
      },
      recentActivity: recentActivityResult.data || [],
      platformHealth: {
        score: Math.max(0, healthScore),
        status: healthScore >= 80 ? 'excellent' : 
                healthScore >= 60 ? 'good' : 
                healthScore >= 40 ? 'fair' : 'needs_attention'
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error('Admin stats API critical failure', error as Error, {
      endpoint: '/api/admin/stats',
      method: 'GET',
      category: 'api_error'
    })

    errorTracker.captureError(error as Error, {
      component: 'AdminStatsAPI',
      action: 'get_stats',
      severity: 'high',
      tags: {
        endpoint: '/api/admin/stats',
        method: 'GET',
        is_admin_endpoint: 'true'
      },
      extra: {
        timestamp: new Date().toISOString(),
        errorMessage
      }
    })

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}