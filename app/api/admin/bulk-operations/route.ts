import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email-service'
import { z } from 'zod'

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  operation: z.enum([
    'bulk_user_activate',
    'bulk_user_deactivate',
    'bulk_user_suspend',
    'bulk_user_make_admin',
    'bulk_user_remove_admin'
  ]),
  userIds: z.array(z.string().uuid()).min(1).max(100), // Limit to 100 users per operation
  reason: z.string().optional(),
  sendNotifications: z.boolean().default(true)
})

// GET - Get bulk operation history
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
    const operationType = searchParams.get('operation_type')

    let query = supabase
      .from('admin_bulk_operations')
      .select(`
        id,
        operation_type,
        total_count,
        success_count,
        failure_count,
        status,
        started_at,
        completed_at,
        parameters,
        admin_id,
        profiles!admin_bulk_operations_admin_id_fkey (
          name
        )
      `)

    // Apply filters
    if (operationType) {
      query = query.eq('operation_type', operationType)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: operations, error, count } = await query
      .range(from, to)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('[Admin API] Error fetching bulk operations:', error)
      return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
    }

    return NextResponse.json({
      operations,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('[Admin API] Bulk operations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Execute bulk operation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin, name')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { operation, userIds, reason, sendNotifications } = bulkOperationSchema.parse(body)

    // Create bulk operation record
    const { data: bulkOperation, error: createError } = await supabase
      .from('admin_bulk_operations')
      .insert({
        admin_id: user.id,
        operation_type: operation,
        affected_users: userIds,
        total_count: userIds.length,
        parameters: { reason, sendNotifications },
        status: 'in_progress'
      })
      .select()
      .single()

    if (createError) {
      console.error('[Admin API] Error creating bulk operation:', createError)
      return NextResponse.json({ error: 'Failed to create operation' }, { status: 500 })
    }

    // Execute the bulk operation
    let successCount = 0
    let failureCount = 0
    const results: string[] = []

    for (const userId of userIds) {
      try {
        // Get user info for notifications
        const { data: targetUser } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', userId)
          .single()

        if (!targetUser) {
          failureCount++
          results.push(`User ${userId}: Not found`)
          continue
        }

        // Determine the action to perform
        let updateData: any = {}
        let emailStatus: 'approved' | 'rejected' | 'suspended' | null = null

        switch (operation) {
          case 'bulk_user_activate':
            updateData = {
              verification_status: 'approved',
              approved_by: user.id,
              approved_at: new Date().toISOString()
            }
            emailStatus = 'approved'
            break
          case 'bulk_user_deactivate':
            updateData = {
              verification_status: 'rejected',
              rejection_reason: reason || 'Bulk deactivation by admin'
            }
            emailStatus = 'rejected'
            break
          case 'bulk_user_suspend':
            updateData = {
              verification_status: 'rejected',
              rejection_reason: reason || 'Account suspended'
            }
            emailStatus = 'suspended'
            break
          case 'bulk_user_make_admin':
            updateData = { is_admin: true }
            break
          case 'bulk_user_remove_admin':
            updateData = { is_admin: false }
            break
        }

        // Update the user
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)

        if (updateError) {
          failureCount++
          results.push(`User ${targetUser.name}: ${updateError.message}`)
          continue
        }

        // Send notification email if enabled and applicable
        if (sendNotifications && emailStatus && targetUser.email) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId)
            const userEmail = authUser?.user?.email

            if (userEmail) {
              await emailService.sendUserStatusNotification(
                userEmail,
                targetUser.name,
                emailStatus,
                reason
              )
            }
          } catch (emailError) {
            console.error(`Failed to send notification to ${targetUser.name}:`, emailError)
            // Don't fail the operation if email fails
          }
        }

        successCount++
        results.push(`User ${targetUser.name}: ${operation.replace('bulk_user_', '').replace('_', ' ')} successful`)

      } catch (userError) {
        failureCount++
        results.push(`User ${userId}: ${userError instanceof Error ? userError.message : 'Unknown error'}`)
      }
    }

    // Update bulk operation with results
    const { error: updateError } = await supabase
      .from('admin_bulk_operations')
      .update({
        success_count: successCount,
        failure_count: failureCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { details: results }
      })
      .eq('id', bulkOperation.id)

    if (updateError) {
      console.error('[Admin API] Error updating bulk operation:', updateError)
    }

    // Send summary email to admin
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false') {
      try {
        const { data: adminAuthUser } = await supabase.auth.admin.getUserById(user.id)
        const adminEmail = adminAuthUser?.user?.email

        if (adminEmail) {
          await emailService.sendBulkOperationSummary(
            adminEmail,
            adminProfile.name || 'Admin',
            operation.replace('bulk_user_', '').replace('_', ' '),
            userIds.length,
            successCount,
            failureCount,
            results.slice(0, 10) // Include first 10 results in email
          )
        }
      } catch (emailError) {
        console.error('[Admin API] Failed to send bulk operation summary:', emailError)
      }
    }

    // Log admin action
    console.log(`[Admin API] Bulk operation completed:`, {
      operationId: bulkOperation.id,
      operation,
      adminId: user.id,
      totalCount: userIds.length,
      successCount,
      failureCount
    })

    return NextResponse.json({
      success: true,
      operationId: bulkOperation.id,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount,
        successRate: Math.round((successCount / userIds.length) * 100)
      },
      results: results
    })

  } catch (error) {
    console.error('[Admin API] Bulk operations POST error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}