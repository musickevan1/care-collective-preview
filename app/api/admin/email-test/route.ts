import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import { createClient } from '@/lib/supabase/server'

/**
 * Email template testing endpoint for admins
 * Allows testing all email templates with sample data
 */

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
      .select('is_admin, name')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { template, email } = body

    if (!template || !email) {
      return NextResponse.json(
        { error: 'Template type and email address are required' },
        { status: 400 }
      )
    }

    let result
    const testName = 'Test User'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swmocarecollective.org'

    switch (template) {
      case 'waitlist':
        result = await emailService.sendWaitlistConfirmation(email, testName)
        break

      case 'approval':
        const confirmUrl = `${siteUrl}/auth/confirm?token=test-token-123`
        result = await emailService.sendApprovalNotification(email, testName, confirmUrl)
        break

      case 'rejection':
        result = await emailService.sendRejectionNotification(
          email,
          testName,
          'This is a test rejection reason for demonstration purposes.'
        )
        break

      case 'help_request':
        const requestUrl = `${siteUrl}/requests/test-request-123`
        result = await emailService.sendHelpRequestNotification(
          email,
          testName,
          'Test Help Request - Groceries Needed',
          requestUrl
        )
        break

      case 'help_offer':
        result = await emailService.sendHelpOfferEmailNotification(
          email,
          testName,
          'Test Helper',
          'Test Help Request - Transportation',
          'I can help with this!',
          `${siteUrl}/messages/test-conversation-123`
        )
        break

      case 'user_activated':
        result = await emailService.sendUserStatusNotification(
          email,
          testName,
          'activated',
          'Your account has been activated and you can now use the platform.'
        )
        break

      case 'user_suspended':
        result = await emailService.sendUserStatusNotification(
          email,
          testName,
          'suspended',
          'Your account has been temporarily suspended due to policy violations.'
        )
        break

      case 'moderation_alert':
        result = await emailService.sendModerationAlert(
          'test-report-123',
          'test-message-456',
          'Test Reporter',
          'This is test inappropriate content for moderation review.',
          'harassment',
          'high',
          `${siteUrl}/admin/moderation/reports/test-report-123`
        )
        break

      case 'bulk_operation':
        result = await emailService.sendBulkOperationSummary(
          email,
          profile.name || 'Admin',
          'approval',
          5,
          4,
          1,
          ['user1@example.com: Successfully approved', 'user2@example.com: Error - already approved'],
          new Date().toISOString()
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown template type: ${template}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      template,
      messageId: result.messageId,
      error: result.error,
      sentTo: email,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Email Template Test] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get list of available email templates
 */
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

    return NextResponse.json({
      templates: [
        { id: 'waitlist', name: 'Waitlist Confirmation', description: 'Sent when user joins waitlist' },
        { id: 'approval', name: 'Application Approval', description: 'Sent when application is approved' },
        { id: 'rejection', name: 'Application Rejection', description: 'Sent when application is rejected' },
        { id: 'help_request', name: 'Help Request Notification', description: 'Sent to potential helpers' },
        { id: 'help_offer', name: 'Help Offer Notification', description: 'Sent when someone offers help' },
        { id: 'user_activated', name: 'Account Activated', description: 'Sent when user account is activated' },
        { id: 'user_suspended', name: 'Account Suspended', description: 'Sent when user account is suspended' },
        { id: 'moderation_alert', name: 'Moderation Alert', description: 'Sent to admins for content reports' },
        { id: 'bulk_operation', name: 'Bulk Operation Summary', description: 'Sent after bulk admin operations' }
      ]
    })
  } catch (error) {
    console.error('[Email Templates] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
