/**
 * @fileoverview API endpoint for starting conversations from help requests
 * POST /api/messaging/help-requests/[id]/start-conversation - Start messaging about a help request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingValidation } from '@/lib/messaging/types';
import { moderationService } from '@/lib/messaging/moderation';
import { messagingServiceV2 } from '@/lib/messaging/service-v2-server';
import { helpRequestRateLimiter } from '@/lib/security/rate-limiter';
import { notifyHelpRequestOffer } from '@/lib/notifications';
import { emailService } from '@/lib/email-service';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * POST /api/messaging/help-requests/[id]/start-conversation
 * Start a conversation to offer help for a specific help request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[start-conversation:${requestId}] Request started`, {
    helpRequestId: params.id,
    timestamp: new Date().toISOString()
  });

  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  try {
    user = await getCurrentUser();
    if (!user) {
      console.log(`[start-conversation:${requestId}] Auth failed - no user`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[start-conversation:${requestId}] User authenticated`, {
      userId: user.id,
      email: user.email
    });

    // Check user restrictions for starting conversations
    let restrictionCheck;
    try {
      restrictionCheck = await moderationService.checkUserRestrictions(user.id, 'start_conversation');
      console.log(`[start-conversation:${requestId}] Restriction check result`, {
        allowed: restrictionCheck.allowed,
        reason: restrictionCheck.reason
      });
    } catch (restrictionError: any) {
      // Fallback if RPC function doesn't exist
      console.warn(`[start-conversation:${requestId}] Restriction check failed, using fallback`, {
        error: restrictionError?.message,
        code: restrictionError?.code
      });
      restrictionCheck = { allowed: true }; // Fail open for now
    }

    if (!restrictionCheck.allowed) {
      console.log(`[start-conversation:${requestId}] User restricted`);
      return NextResponse.json(
        {
          error: restrictionCheck.reason || 'You are restricted from starting new conversations.',
          restriction_level: restrictionCheck.restrictionLevel
        },
        { status: 403 }
      );
    }

    // Check rate limit for starting help conversations (10 per hour)
    const rateLimitResponse = await helpRequestRateLimiter.middleware(request, user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const helpRequestId = params.id;
    if (!helpRequestId) {
      return NextResponse.json(
        { error: 'Help request ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(helpRequestId)) {
      return NextResponse.json(
        { error: 'Invalid help request ID format' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check user's verification status first (required by RLS policies)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.verification_status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Your account must be approved to offer help. Please complete the verification process.',
          requiresApproval: true
        },
        { status: 403 }
      );
    }

    // Fetch help request details first to get the recipient
    // Use explicit foreign key name to avoid ambiguity (help_requests has both user_id and helper_id)
    const { data: helpRequest, error: helpError } = await supabase
      .from('help_requests')
      .select(`
        id,
        user_id,
        title,
        description,
        category,
        urgency,
        status,
        created_at,
        owner:profiles!user_id (
          id,
          name,
          location
        )
      `)
      .eq('id', helpRequestId)
      .single();

    if (helpError || !helpRequest) {
      // Log the actual error for debugging
      console.error('Help request fetch error:', {
        helpRequestId,
        userId: user.id,
        error: helpError,
        message: helpError?.message,
        code: helpError?.code
      });

      return NextResponse.json(
        {
          error: 'Help request not found or you do not have access to view it',
          details: process.env.NODE_ENV === 'development' ? helpError?.message : undefined
        },
        { status: 404 }
      );
    }

    // Check if help request is still open
    if (helpRequest.status !== 'open') {
      return NextResponse.json(
        { error: `This help request is ${helpRequest.status} and no longer accepting offers` },
        { status: 400 }
      );
    }

    // Prevent users from messaging themselves
    if (helpRequest.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot offer help on your own request' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body with recipient_id derived from help request
    const validation = messagingValidation.helpRequestConversation.safeParse({
      help_request_id: helpRequestId,
      recipient_id: helpRequest.user_id, // Derive from help request
      ...body
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // If client sent recipient_id, validate it matches the help request owner
    if (body.recipient_id && body.recipient_id !== helpRequest.user_id) {
      return NextResponse.json(
        { error: 'Invalid recipient for this help request' },
        { status: 400 }
      );
    }

    // Check if a conversation already exists between these users for this help request
    // V2: Direct query on conversations_v2 table (has requester_id and helper_id)
    console.log(`[start-conversation:${requestId}] Checking for existing conversation (V2)`);

    try {
      const { data: existingConv, error: dupeError } = await supabase
        .from('conversations_v2')
        .select('id')
        .eq('help_request_id', helpRequestId)
        .eq('helper_id', user.id)
        .maybeSingle();

      if (dupeError) {
        console.error(`[start-conversation:${requestId}] Error checking duplicates`, {
          error: dupeError.message,
          code: dupeError.code
        });
      }

      if (existingConv) {
        console.log(`[start-conversation:${requestId}] Duplicate conversation found`, {
          conversationId: existingConv.id
        });
        return NextResponse.json(
          {
            error: 'You already have a conversation about this help request',
            conversation_id: existingConv.id
          },
          { status: 409 }
        );
      }

      console.log(`[start-conversation:${requestId}] No duplicate conversation found`);
    } catch (dupeError: any) {
      console.error(`[start-conversation:${requestId}] Duplicate check failed`, {
        error: dupeError?.message,
        stack: dupeError?.stack
      });
      // Continue anyway - V2 RPC will also check for duplicates
    }

    // Create the conversation using V2 atomic RPC
    console.log(`[start-conversation:${requestId}] Creating conversation (V2)`);

    const rpcResult = await messagingServiceV2.createHelpConversation({
      help_request_id: helpRequestId,
      helper_id: user.id,
      initial_message: validation.data.initial_message,
    });

    if (!rpcResult.success) {
      console.error(`[start-conversation:${requestId}] V2 RPC failed`, {
        error: rpcResult.error,
        message: rpcResult.message,
      });

      // Map V2 error codes to HTTP responses
      switch (rpcResult.error) {
        case 'conversation_exists':
          return NextResponse.json(
            {
              error: 'You already have a conversation about this help request',
              conversation_id: rpcResult.conversation_id, // Allow navigation to existing
            },
            { status: 409 }
          );

        case 'help_request_unavailable':
          return NextResponse.json(
            { error: 'This help request is no longer accepting offers' },
            { status: 400 }
          );

        case 'permission_denied':
          return NextResponse.json(
            { error: 'You do not have permission to create this conversation' },
            { status: 403 }
          );

        case 'validation_error':
          return NextResponse.json(
            { error: rpcResult.message || 'Invalid conversation data' },
            { status: 400 }
          );

        default:
          // Generic server error
          return NextResponse.json(
            {
              error: 'Failed to start conversation. Please try again.',
              details: process.env.NODE_ENV === 'development' ? rpcResult.details : undefined,
            },
            { status: 500 }
          );
      }
    }

    const conversationResult = { id: rpcResult.conversation_id };

    // Log the help offer for analytics
    console.log('Help conversation started:', {
      version: 'v2',
      conversationId: conversationResult.id,
      helpRequestId: helpRequestId,
      helpRequestTitle: helpRequest.title,
      offerer: user.id,
      requester: helpRequest.user_id,
      category: helpRequest.category,
      urgency: helpRequest.urgency,
      timestamp: new Date().toISOString()
    });

    // Update help request status to 'in_progress' if this is the first offer
    const { data: existingConversations } = await supabase
      .from('conversations_v2')
      .select('id')
      .eq('help_request_id', helpRequestId);

    if (!existingConversations || existingConversations.length <= 1) {
      await supabase
        .from('help_requests')
        .update({ status: 'in_progress' })
        .eq('id', helpRequestId);
    }

    // Get helper's profile name for notification
    const { data: helperProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    // Send notification to request owner (fire-and-forget)
    if (helperProfile) {
      notifyHelpRequestOffer({
        requesterId: helpRequest.user_id,
        helperId: user.id,
        helperName: helperProfile.name || 'Someone',
        requestId: helpRequestId,
        requestTitle: helpRequest.title
      }).catch(error => {
        console.error('[POST /start-conversation] Failed to send notification:', error);
      });
    }

    // Send email notification to request owner (fire-and-forget)
    try {
      const { data: requestOwner } = await supabase.auth.admin.getUserById(helpRequest.user_id);
      if (requestOwner?.user?.email) {
        const ownerProfile = helpRequest.owner as { name?: string } | null;
        emailService.sendHelpOfferEmailNotification(
          requestOwner.user.email,
          ownerProfile?.name || 'CARE Member',
          helperProfile?.name || 'A community member',
          helpRequest.title,
          helpRequest.id
        ).catch(err => console.error('[POST /start-conversation] Failed to send help offer email:', err));
      }
    } catch (emailError) {
      console.warn('[POST /start-conversation] Could not send email notification:', emailError);
    }

    console.log(`[start-conversation:${requestId}] Conversation created successfully, returning minimal response`);

    // Return minimal response - client will fetch full details after redirect
    return NextResponse.json({
      success: true,
      conversation_id: conversationResult.id,
      help_request_id: helpRequestId,
      message: 'Conversation started successfully. You can now coordinate help with the requester.'
    }, { status: 201 });

  } catch (error: any) {
    console.error(`[start-conversation:${requestId}] CRITICAL ERROR:`, {
      error: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      helpRequestId: params.id,
      userId: user?.id
    });

    if (error instanceof Error && error.message.includes('privacy settings')) {
      return NextResponse.json(
        { error: 'This user has restricted who can message them. You may need to wait for them to contact you.' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('no longer open')) {
      return NextResponse.json(
        { error: 'This help request is no longer accepting new offers' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start conversation. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messaging/help-requests/[id]/conversations
 * Get existing conversations for a help request (for request owner)
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

    const helpRequestId = params.id;
    if (!helpRequestId) {
      return NextResponse.json(
        { error: 'Help request ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user owns this help request
    const { data: helpRequest, error: helpError } = await supabase
      .from('help_requests')
      .select('user_id')
      .eq('id', helpRequestId)
      .eq('user_id', user.id)
      .single();

    if (helpError || !helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found or you do not have access' },
        { status: 404 }
      );
    }

    // Get all conversations for this help request
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        last_message_at,
        status,
        conversation_participants!inner (
          user_id,
          profiles (
            id,
            name,
            location
          )
        )
      `)
      .eq('help_request_id', helpRequestId)
      .eq('conversation_participants.user_id', user.id)
      .is('conversation_participants.left_at', null)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      throw conversationsError;
    }

    // Get unread count and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const [unreadCount, lastMessage] = await Promise.all([
          supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .is('read_at', null)
            .then(({ count }) => count || 0),
          supabase
            .from('messages')
            .select(`
              content,
              created_at,
              sender:profiles!messages_sender_id_fkey (
                name
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => data)
        ]);

        // Get the other participant (helper)
        const helper = conv.conversation_participants.find(p => p.user_id !== user.id);

        return {
          id: conv.id,
          created_at: conv.created_at,
          last_message_at: conv.last_message_at,
          status: conv.status,
          helper: helper?.profiles,
          unread_count: unreadCount,
          last_message: lastMessage
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithDetails,
      total: conversationsWithDetails.length
    });

  } catch (error) {
    console.error('Error fetching help request conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}