/**
 * API Route for cancelling help requests
 * POST /api/requests/[id]/cancel - Cancel help request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyHelpRequestCancelled } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      );
    }

    // Parse optional cancel reason from body
    let cancelReason: string | undefined;
    try {
      const body = await request.json();
      cancelReason = body.reason;
    } catch {
      // No body or invalid JSON - that's okay, reason is optional
    }

    // Get the help request to verify ownership and get details
    const { data: helpRequest, error: fetchError } = await supabase
      .from('help_requests')
      .select('id, user_id, helper_id, title, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      );
    }

    // Verify user is either the owner or the helper
    const isOwner = helpRequest.user_id === user.id;
    const isHelper = helpRequest.helper_id === user.id;

    if (!isOwner && !isHelper) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this request' },
        { status: 403 }
      );
    }

    // Check if already cancelled or completed
    if (helpRequest.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Request is already cancelled' },
        { status: 400 }
      );
    }

    if (helpRequest.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed request' },
        { status: 400 }
      );
    }

    // Update the help request
    const { error: updateError } = await supabase
      .from('help_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[POST /cancel] Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel request' },
        { status: 500 }
      );
    }

    // Send notification to the other party (fire-and-forget)
    // If owner cancelled and there's a helper, notify helper
    // If helper cancelled (withdrew), notify owner
    if (isOwner && helpRequest.helper_id) {
      notifyHelpRequestCancelled({
        requesterId: helpRequest.user_id,
        helperId: helpRequest.helper_id,
        requestId: helpRequest.id,
        requestTitle: helpRequest.title,
        cancelReason,
        cancelledBy: 'requester',
      }).catch((error) => {
        console.error('[POST /cancel] Failed to send notification:', error);
      });
    } else if (isHelper) {
      notifyHelpRequestCancelled({
        requesterId: helpRequest.user_id,
        helperId: user.id,
        requestId: helpRequest.id,
        requestTitle: helpRequest.title,
        cancelReason,
        cancelledBy: 'helper',
      }).catch((error) => {
        console.error('[POST /cancel] Failed to send notification:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Help request cancelled',
    });
  } catch (error) {
    console.error('[POST /cancel] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
}
