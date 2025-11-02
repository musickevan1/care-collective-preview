/**
 * @fileoverview API endpoint for reporting inappropriate messages
 * POST /api/messaging/messages/[id]/report - Report a message for moderation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailService } from '@/lib/email-service';
import { messagingClient } from '@/lib/messaging/client';
import { messagingValidation } from '@/lib/messaging/types';
import { reportRateLimiter } from '@/lib/security/rate-limiter';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * POST /api/messaging/messages/[id]/report
 * Report a message for inappropriate content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit for reporting (5 reports per hour)
    const rateLimitResponse = await reportRateLimiter.middleware(request, user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const messageId = params.id;
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate report data
    const validation = messagingValidation.reportMessage.safeParse({
      message_id: messageId,
      ...body
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid report data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    // Verify the message exists and user has access to it
    const supabase = await createClient();
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        sender:profiles!messages_sender_id_fkey (
          id,
          name
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the conversation
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (!participants) {
      return NextResponse.json(
        { error: 'You do not have access to this message' },
        { status: 403 }
      );
    }

    // Prevent users from reporting their own messages
    if (message.sender_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own messages' },
        { status: 400 }
      );
    }

    // Check if user has already reported this message
    const { data: existingReport } = await supabase
      .from('message_reports')
      .select('id')
      .eq('message_id', messageId)
      .eq('reported_by', user.id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this message' },
        { status: 409 }
      );
    }

    // Create the report
    const report = await messagingClient.reportMessage(user.id, validation.data);

    // Log the report for admin review
    console.log('Message reported:', {
      reportId: report.id,
      messageId: messageId,
      reportedBy: user.id,
      reason: validation.data.reason,
      messageSender: message.sender_id,
      timestamp: new Date().toISOString()
    });

    // Send notification to admins (in production, use proper notification system)
    try {
      await notifyAdminsOfReport(report, message, user);
    } catch (notificationError) {
      console.error('Failed to notify admins of report:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
      report_id: report.id,
      status: 'pending'
    }, { status: 201 });

  } catch (error) {
    console.error('Error reporting message:', error);

    if (error instanceof Error && error.message.includes('access')) {
      return NextResponse.json(
        { error: 'You do not have permission to report this message' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

/**
 * Notify administrators of a new message report
 * Integrates with email service for immediate admin alerts
 */
async function notifyAdminsOfReport(
  report: any,
  message: any,
  reporter: any
): Promise<void> {
  // Log the incident for audit trail
  console.warn('ADMIN ALERT: New message report', {
    reportId: report.id,
    messageId: message.id,
    reason: report.reason,
    reporterName: reporter.email,
    messageSender: message.sender.name,
    messageContent: message.content.substring(0, 100), // First 100 chars for context
    timestamp: new Date().toISOString()
  });

  // Send email notification to administrators
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false') {
    try {
      // Determine severity based on report reason
      let severity: 'low' | 'medium' | 'high' = 'medium';

      if (['harassment', 'scam', 'personal_info'].includes(report.reason)) {
        severity = 'high';
      } else if (['inappropriate', 'spam'].includes(report.reason)) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      const emailResult = await emailService.sendModerationAlert(
        report.id,
        message.id,
        report.reason,
        reporter.email,
        message.sender.name,
        message.content.substring(0, 100), // Preview for context
        severity
      );

      if (!emailResult.success) {
        console.error('Failed to send admin notification email:', emailResult.error);
      } else {
        console.log('Admin notification email sent successfully:', emailResult.messageId);
      }
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      // Don't fail the request if email fails
    }
  }
}

/**
 * GET /api/messaging/messages/[id]/report
 * Get report status for a specific message (admin only or original reporter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get reports for this message that the user created
    const { data: reports, error } = await supabase
      .from('message_reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        reviewed_at
      `)
      .eq('message_id', messageId)
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ reports: reports || [] });

  } catch (error) {
    console.error('Error fetching report status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report status' },
      { status: 500 }
    );
  }
}