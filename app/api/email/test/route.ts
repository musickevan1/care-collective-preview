import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import { createClient } from '@/lib/supabase/server'

/**
 * Test endpoint for email service configuration
 * Only accessible by admins
 */
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

    // Test email configuration
    const configTest = await emailService.testConfiguration()
    
    return NextResponse.json({
      configuration: configTest,
      environment: process.env.NODE_ENV,
      hasResendKey: !!process.env.RESEND_API_KEY,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Email Test] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Send a test email (admin only)
 */
export async function POST(request: NextRequest) {
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
      .select('is_admin, name')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get test email address from request body
    const body = await request.json()
    const testEmail = body.email || 'admin@carecollective.org'

    // Send test email
    const result = await emailService.sendEmail({
      to: testEmail,
      subject: '🧪 Care Collective Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #324158;">Email Service Test</h2>
          <p>This is a test email from the Care Collective platform.</p>
          <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #BC6547; margin-top: 0;">Test Details</h3>
            <ul style="color: #483129;">
              <li><strong>Sent by:</strong> ${profile.name}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              <li><strong>Environment:</strong> ${process.env.NODE_ENV}</li>
              <li><strong>Service:</strong> ${process.env.RESEND_API_KEY ? 'Resend' : 'Console Logging'}</li>
            </ul>
          </div>
          <p>If you received this email, the email service is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">Care Collective - Email Service Test</p>
        </div>
      `
    })

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      sentTo: testEmail,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Email Test] Send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}