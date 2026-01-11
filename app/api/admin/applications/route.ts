import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email-service'
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
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications })
  } catch {
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
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // Send notification email to user about decision
    try {
      // Get user email for notification
      const { data: targetUser } = await supabase.auth.admin.getUserById(applicationId)
      const userEmail = targetUser?.user?.email
      const userName = data.name || 'User'

      if (userEmail && process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false') {
        const emailResult = await emailService.sendApplicationDecision(
          userEmail,
          userName,
          action === 'approve' ? 'approved' : 'rejected',
          reason
        )

        // Email result tracked via email service - no console logging needed
      }
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      application: data,
      action: action
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}