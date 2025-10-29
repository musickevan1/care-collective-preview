/**
 * @fileoverview API endpoint for starting conversations from help requests
 * POST /api/messaging/help-requests/[id]/start-conversation - Start messaging about a help request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingClient } from '@/lib/messaging/client';
import { messagingValidation } from '@/lib/messaging/types';
import { moderationService } from '@/lib/messaging/moderation';

// Rate limiting for help request conversations
const helpConversationCounts = new Map<string, { count: number; resetTime: number }>();

function checkHelpConversationRateLimit(userId: string, maxConversations: number = 10, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const userLimit = helpConversationCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    helpConversationCounts.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxConversations) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

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

  try {
    const user = await getCurrentUser();
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
    if (!checkHelpConversationRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'You have started too many help conversations recently. Please wait before offering more help.' },
        { status: 429 }
      );
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
    // FIXED: Avoid !inner join to prevent RLS recursion
    console.log(`[start-conversation:${requestId}] Checking for existing conversation`);

    try {
      // Step 1: Find conversations for this help request where current user is a participant
      const { data: userParticipations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (partError) {
        console.error(`[start-conversation:${requestId}] Error fetching participations`, {
          error: partError.message,
          code: partError.code
        });
      }

      if (userParticipations && userParticipations.length > 0) {
        const convIds = userParticipations.map(p => p.conversation_id);

        // Step 2: Check which of these conversations are for this help request
        const { data: helpConversations, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('help_request_id', helpRequestId)
          .in('id', convIds);

        if (convError) {
          console.error(`[start-conversation:${requestId}] Error fetching conversations`, {
            error: convError.message,
            code: convError.code
          });
        }

        if (helpConversations && helpConversations.length > 0) {
          // Step 3: Check if help request owner is in any of these conversations
          for (const conv of helpConversations) {
            const { data: ownerParticipation } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id)
              .eq('user_id', helpRequest.user_id)
              .is('left_at', null);

            if (ownerParticipation && ownerParticipation.length > 0) {
              console.log(`[start-conversation:${requestId}] Duplicate conversation found`, {
                conversationId: conv.id
              });
              return NextResponse.json(
                {
                  error: 'You already have a conversation about this help request',
                  conversation_id: conv.id
                },
                { status: 409 }
              );
            }
          }
        }
      }
      console.log(`[start-conversation:${requestId}] No duplicate conversation found`);
    } catch (dupeError: any) {
      console.error(`[start-conversation:${requestId}] Duplicate check failed`, {
        error: dupeError?.message,
        stack: dupeError?.stack
      });
      // Continue anyway - better to allow duplicate than block legitimate conversation
    }

    // Create the conversation using the specialized help request function
    console.log(`[start-conversation:${requestId}] Creating conversation via messagingClient`);
    let conversation;
    try {
      conversation = await messagingClient.startHelpConversation(user.id, validation.data);
      console.log(`[start-conversation:${requestId}] Conversation created successfully`, {
        conversationId: conversation.id
      });
    } catch (createError: any) {
      console.error(`[start-conversation:${requestId}] Failed to create conversation`, {
        error: createError?.message,
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
        stack: createError?.stack
      });
      throw createError;
    }

    // Log the help offer for analytics
    console.log('Help conversation started:', {
      conversationId: conversation.id,
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
      .from('conversations')
      .select('id')
      .eq('help_request_id', helpRequestId);

    if (!existingConversations || existingConversations.length <= 1) {
      await supabase
        .from('help_requests')
        .update({ status: 'in_progress' })
        .eq('id', helpRequestId);
    }

    console.log(`[start-conversation:${requestId}] Conversation created successfully, returning minimal response`);

    // Return minimal response - client will fetch full details after redirect
    return NextResponse.json({
      success: true,
      conversation_id: conversation.id,
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