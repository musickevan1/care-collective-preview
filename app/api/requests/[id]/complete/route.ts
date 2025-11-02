/**
 * API Route for completing help requests
 * POST /api/requests/[id]/complete - Mark help request as completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyHelpRequestCompleted } from '@/lib/notifications';

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
        { error: 'You do not have permission to complete this request' },
        { status: 403 }
      );
    }

    // Check if already completed
    if (helpRequest.status === 'completed') {
      return NextResponse.json(
        { error: 'Request is already completed' },
        { status: 400 }
      );
    }

    // Update the help request
    const { error: updateError } = await supabase
      .from('help_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[POST /complete] Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete request' },
        { status: 500 }
      );
    }

    // Send notification (fire-and-forget)
    if (helpRequest.helper_id) {
      notifyHelpRequestCompleted({
        requesterId: helpRequest.user_id,
        helperId: helpRequest.helper_id,
        requestId: helpRequest.id,
        requestTitle: helpRequest.title,
        completedBy: isOwner ? 'requester' : 'helper',
      }).catch((error) => {
        console.error('[POST /complete] Failed to send notification:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Help request marked as completed',
    });
  } catch (error) {
    console.error('[POST /complete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to complete request' },
      { status: 500 }
    );
  }
}
