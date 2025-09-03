import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // For testing purposes, we'll just send a notification to the test email
    // In production, this would integrate with a proper email service
    const notificationEmail = 'evanmusick.dev@gmail.com'
    
    let emailContent = ''
    let subject = ''

    if (!userProfile) {
      return NextResponse.json({ error: 'Unable to fetch user profile' }, { status: 500 })
    }

    switch (type) {
      case 'new_application':
        subject = 'Care Collective - New Application Submitted'
        emailContent = `
New Application Submitted

Name: ${userProfile.name || 'Unknown'}
Status: ${userProfile.verification_status}
Time: ${new Date().toLocaleString()}

Please review the application in the admin panel:
${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/applications

Care Collective Admin System
        `
        break
        
      case 'status_change':
        subject = `Care Collective - Application ${adminAction === 'approve' ? 'Approved' : 'Rejected'}`
        emailContent = `
Application Status Update

User: ${userProfile.name || 'Unknown'}
Status: ${userProfile.verification_status}
${userProfile.rejection_reason ? `Reason: ${userProfile.rejection_reason}` : ''}
Updated: ${new Date().toLocaleString()}

Admin Panel: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/applications

Care Collective Admin System
        `
        break
        
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // For development/testing, we'll just log the email content
    // In production, you would integrate with a service like SendGrid, AWS SES, etc.
    console.log('\n=== EMAIL NOTIFICATION ===')
    console.log(`To: ${notificationEmail}`)
    console.log(`Subject: ${subject}`)
    console.log(`Content: ${emailContent}`)
    console.log('=========================\n')

    // For now, we'll simulate successful email sending
    // TODO: Integrate with actual email service
    
    return NextResponse.json({ 
      success: true, 
      message: `Notification email logged for ${type}`,
      // In development, include the email content in the response for testing
      ...(process.env.NODE_ENV === 'development' && {
        emailContent,
        subject,
        recipient: notificationEmail
      })
    })

  } catch (error) {
    console.error('Email notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notification' 
    }, { status: 500 })
  }
}