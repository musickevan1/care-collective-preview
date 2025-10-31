/**
 * @fileoverview API endpoint for processing moderation queue items
 * Allows administrators to take action on reported messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderationService } from '@/lib/messaging/moderation';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

async function isAdminUser(userId: string): Promise<boolean> {
  // In production, implement proper admin role checking
  // For demo purposes, allowing all authenticated users to be admins
  return true;
}

/**
 * POST /api/admin/moderation/[id]/process
 * Process a moderation queue item with specified action
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

    // Check admin privileges
    const isAdmin = await isAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, notes } = body;

    // Validate action
    const validActions = ['dismiss', 'hide_message', 'warn_user', 'restrict_user', 'ban_user'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required' },
        { status: 400 }
      );
    }

    // Verify the report exists and is pending
    const supabase = await createClient();
    const { data: report, error: reportError } = await supabase
      .from('message_reports')
      .select(`
        id,
        status,
        message_id,
        reason,
        messages!inner (
          id,
          sender_id,
          content
        )
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        { error: 'Report has already been processed' },
        { status: 400 }
      );
    }

    // Process the moderation action
    await moderationService.processModerationItem(
      reportId,
      action,
      user.id,
      notes
    );

    // Log the admin action for audit purposes
    console.log('Moderation action processed:', {
      reportId,
      action,
      adminId: user.id,
      messageId: report.message_id,
      senderId: Array.isArray(report.messages) ? report.messages[0]?.sender_id : report.messages?.sender_id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Moderation action applied successfully',
      action,
      reportId
    });

  } catch (error) {
    console.error('Error processing moderation action:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Report or message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}