import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get admin dashboard statistics
export async function GET() {
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

    // Handle any errors
    if (pendingApplicationsResult.error) {
      console.error('[Admin Stats] Pending applications error:', pendingApplicationsResult.error)
    }

    if (recentActivityResult.error) {
      console.error('[Admin Stats] Recent activity error:', recentActivityResult.error)
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
    console.error('[Admin API] Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}