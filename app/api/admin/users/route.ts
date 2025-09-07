import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for user management actions
const userActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['activate', 'deactivate', 'make_admin', 'remove_admin']),
  reason: z.string().optional()
})

// GET - Get all users with pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // approved, pending, rejected
    const search = searchParams.get('search') // search by name

    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        location,
        verification_status,
        is_admin,
        created_at,
        applied_at,
        approved_at,
        application_reason,
        phone,
        approved_by,
        rejection_reason
      `)

    // Apply filters
    if (status) {
      query = query.eq('verification_status', status)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin API] Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('[Admin API] Users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Perform user management actions
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

    // Parse and validate request body
    const body = await request.json()
    const { userId, action, reason } = userActionSchema.parse(body)

    // Prevent admin from removing their own admin status
    if (userId === user.id && action === 'remove_admin') {
      return NextResponse.json({ 
        error: 'Cannot remove admin privileges from yourself' 
      }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'activate':
        updateData = { 
          verification_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        }
        break
      case 'deactivate':
        updateData = { 
          verification_status: 'rejected',
          rejection_reason: reason || 'Deactivated by admin'
        }
        break
      case 'make_admin':
        updateData = { is_admin: true }
        break
      case 'remove_admin':
        updateData = { is_admin: false }
        break
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Admin API] Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log admin action
    console.log(`[Admin API] User ${action}:`, { 
      userId, 
      adminId: user.id,
      reason 
    })

    // TODO: Send notification email to user about status change

    return NextResponse.json({ 
      success: true, 
      user: data,
      action: action
    })
  } catch (error) {
    console.error('[Admin API] Users POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}