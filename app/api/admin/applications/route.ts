import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for application actions
const applicationActionSchema = z.object({
  applicationId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
})

// GET - Get all pending applications
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

    // Get pending applications
    const { data: applications, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        location,
        application_reason,
        applied_at,
        verification_status,
        created_at
      `)
      .eq('verification_status', 'pending')
      .order('applied_at', { ascending: true })

    if (error) {
      console.error('[Admin API] Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('[Admin API] Applications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or reject an application
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
    const { applicationId, action, reason } = applicationActionSchema.parse(body)

    // Update application status
    const updateData: any = {
      verification_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    }

    if (action === 'reject' && reason) {
      updateData.rejection_reason = reason
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('[Admin API] Error updating application:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // TODO: Send notification email to user about decision
    console.log(`[Admin API] Application ${action}d:`, { applicationId, adminId: user.id })

    return NextResponse.json({ 
      success: true, 
      application: data,
      action: action
    })
  } catch (error) {
    console.error('[Admin API] Applications POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}