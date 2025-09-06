import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email-service'

// Email templates for different notification types
const EMAIL_TEMPLATES = {
  waitlist_confirmation: {
    subject: '📋 You\'re on the Care Collective waitlist',
    html: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Welcome to Care Collective, ${name}!</h2>
        <p>Thank you for your interest in joining our mutual aid community.</p>
        <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #BC6547; margin-top: 0;">What happens next?</h3>
          <ol style="color: #483129;">
            <li>Our team will review your application</li>
            <li>You'll receive an email once a decision is made</li>
            <li>You can check your application status anytime by logging in</li>
          </ol>
        </div>
        <p style="color: #7A9E99;"><strong>No email confirmation needed yet!</strong></p>
        <p>You can log in immediately to view your waitlist status. Email confirmation will only be required if your application is approved.</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Building stronger communities through mutual aid</p>
      </div>
    `
  },
  approval: {
    subject: '✅ Welcome to Care Collective - Please Confirm Your Email',
    html: (name: string, confirmUrl: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Congratulations, ${name}! 🎉</h2>
        <p>Your application to join Care Collective has been <strong style="color: #5A7D78;">approved</strong>!</p>
        <div style="background: #A3C4BF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #FFF; margin-top: 0;">One Final Step</h3>
          <p style="color: #FFF;">Please confirm your email to access the full platform:</p>
          <a href="${confirmUrl}" style="display: inline-block; background: #BC6547; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirm Email & Get Started</a>
        </div>
        <p>After confirming your email, you'll be able to:</p>
        <ul style="color: #483129;">
          <li>Create and respond to help requests</li>
          <li>Connect with community members</li>
          <li>Share resources and support</li>
        </ul>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:<br>${confirmUrl}</p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Southwest Missouri's mutual aid network</p>
      </div>
    `
  },
  rejection: {
    subject: '📝 Care Collective Application Update',
    html: (name: string, reason: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #324158;">Hello ${name},</h2>
        <p>Thank you for your interest in joining Care Collective.</p>
        <div style="background: #FBF2E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>After careful review, we're unable to approve your application at this time.</p>
          ${reason ? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px;">
              <strong style="color: #BC6547;">Feedback:</strong>
              <p style="color: #483129; margin-top: 10px;">${reason}</p>
            </div>
          ` : ''}
        </div>
        <div style="background: #E5C6C1; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #324158; margin-top: 0;">You Can Reapply</h3>
          <p style="color: #483129;">We encourage you to reapply after addressing any concerns mentioned above. Simply log in to your account and submit a new application with updated information.</p>
        </div>
        <p>If you have questions, please contact us at <a href="mailto:evanmusick.dev@gmail.com" style="color: #7A9E99;">evanmusick.dev@gmail.com</a></p>
        <hr style="border: none; border-top: 1px solid #E5C6C1; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">Care Collective - Building trust and community together</p>
      </div>
    `
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, adminAction } = body

    // Validate the request
    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For new applications, skip admin check (the new user is making the request)
    if (type !== 'new_application') {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('is_admin, verification_status')
        .eq('id', user.id)
        .single()

      if (!adminProfile?.is_admin || adminProfile.verification_status !== 'approved') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get user details
    let userProfile = null
    if (type === 'new_application') {
      // For new applications, use the current user's profile
      const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('name, verification_status, rejection_reason')
        .eq('id', user.id)
        .single()
      
      userProfile = currentProfile
      if (currentError) {
        console.warn('Could not fetch new user profile:', currentError)
        userProfile = { name: user.email || 'Unknown User', verification_status: 'pending', rejection_reason: null }
      }
    } else {
      // For status changes, use the provided userId
      if (!userId) {
        return NextResponse.json({ error: 'User ID required for status change' }, { status: 400 })
      }
      
      const { data: targetProfile, error: userError } = await supabase
        .from('profiles')
        .select('name, verification_status, rejection_reason')
        .eq('id', userId)
        .single()

      if (userError || !targetProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      userProfile = targetProfile
    }

    // Get user's email for sending notifications
    let userEmail = ''
    if (type === 'new_application') {
      userEmail = user.email || ''
    } else if (type === 'status_change' && userId) {
      // Get the target user's email
      const { data: targetUser } = await supabase.auth.admin.getUserById(userId)
      userEmail = targetUser?.user?.email || ''
    }

    if (!userProfile) {
      return NextResponse.json({ error: 'Unable to fetch user profile' }, { status: 500 })
    }

    // Admin notification email
    const adminEmail = 'evanmusick.dev@gmail.com'
    let emailHtml = ''
    let subject = ''
    let recipientEmail = adminEmail // Default to admin

    switch (type) {
      case 'new_application':
        // Send waitlist confirmation to user
        if (userEmail) {
          subject = EMAIL_TEMPLATES.waitlist_confirmation.subject
          emailHtml = EMAIL_TEMPLATES.waitlist_confirmation.html(userProfile.name || 'Friend')
          recipientEmail = userEmail
        }
        
        // Also notify admin (separate email in production)
        console.log(`Admin Notification: New application from ${userProfile.name} (${userEmail})`)
        break
        
      case 'status_change':
        if (!userEmail) {
          return NextResponse.json({ error: 'User email not found' }, { status: 400 })
        }
        
        if (adminAction === 'approve') {
          // Generate confirmation link (in production, this would use Supabase's email confirmation)
          const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=email_confirm`
          subject = EMAIL_TEMPLATES.approval.subject
          emailHtml = EMAIL_TEMPLATES.approval.html(userProfile.name || 'Friend', confirmUrl)
        } else {
          subject = EMAIL_TEMPLATES.rejection.subject
          emailHtml = EMAIL_TEMPLATES.rejection.html(
            userProfile.name || 'Friend',
            userProfile.rejection_reason || ''
          )
        }
        recipientEmail = userEmail
        break
        
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Send email using the email service
    let emailResult;
    
    switch (type) {
      case 'waitlist_confirmation':
        emailResult = await emailService.sendWaitlistConfirmation(recipientEmail, userProfile.name || 'Friend')
        break
      case 'admin_action':
        if (adminAction === 'approve') {
          const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=email_confirm`
          emailResult = await emailService.sendApprovalNotification(recipientEmail, userProfile.name || 'Friend', confirmUrl)
        } else if (adminAction === 'reject') {
          emailResult = await emailService.sendRejectionNotification(recipientEmail, userProfile.name || 'Friend', userProfile.rejection_reason)
        } else {
          return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 })
        }
        break
      default:
        // Fallback to generic email sending
        emailResult = await emailService.sendEmail({
          to: recipientEmail,
          subject,
          html: emailHtml
        })
    }

    if (!emailResult.success) {
      console.error('[Notify API] Email sending failed:', emailResult.error)
      return NextResponse.json({ 
        error: 'Failed to send email notification',
        details: emailResult.error 
      }, { status: 500 })
    }

    console.log(`[Notify API] Email sent successfully to ${recipientEmail} (${type})`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Notification email sent to ${recipientEmail}`,
      messageId: emailResult.messageId,
      type,
      adminAction
    })

  } catch (error) {
    console.error('Email notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notification' 
    }, { status: 500 })
  }
}