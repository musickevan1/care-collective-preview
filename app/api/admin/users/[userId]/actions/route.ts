import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { userId } = params
    const body = await request.json()
    const { action, reason } = body

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Perform the requested action
    let updateData: any = {}
    let responseMessage = ''

    switch (action) {
      case 'approve':
        updateData = {
          verification_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          rejection_reason: null
        }
        responseMessage = 'User approved successfully'
        break

      case 'reject':
        updateData = {
          verification_status: 'rejected',
          rejection_reason: reason || 'No reason provided',
          approved_at: null,
          approved_by: null
        }
        responseMessage = 'User rejected successfully'
        break

      case 'deactivate':
        // In a real implementation, you might want to disable their auth account
        updateData = {
          verification_status: 'rejected',
          rejection_reason: 'Account deactivated by admin'
        }
        responseMessage = 'User deactivated successfully'
        break

      case 'admin':
        updateData = {
          is_admin: true
        }
        responseMessage = 'User granted admin privileges'
        break

      case 'remove_admin':
        updateData = {
          is_admin: false
        }
        responseMessage = 'Admin privileges removed'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the user profile
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Create audit log entry
    try {
      const { error: auditError } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action: action,
          target_user_id: userId,
          details: {
            reason: reason || null,
            previous_status: body.previousStatus || null
          }
        })

      if (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the request if audit logging fails
      }
    } catch (auditError) {
      console.error('Audit logging error:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      user: data
    })

  } catch (error) {
    console.error('Error performing user action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}