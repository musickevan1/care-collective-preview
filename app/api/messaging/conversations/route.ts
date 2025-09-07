/**
 * @fileoverview API endpoints for managing conversations
 * GET /api/messaging/conversations - List user's conversations
 * POST /api/messaging/conversations - Create new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingClient } from '@/lib/messaging/client';
import { messagingValidation } from '@/lib/messaging/types';
import { z } from 'zod';

// Rate limiting setup (in production, use Redis or external service)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/messaging/conversations
 * Get user's conversations with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await messagingClient.getConversations(user.id, { page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messaging/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (stricter for creating conversations)
    if (!checkRateLimit(`create_conv_${user.id}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many conversation creation attempts. Please wait.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = messagingValidation.createConversation.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { recipient_id, help_request_id, initial_message } = validation.data;

    // Prevent users from messaging themselves
    if (recipient_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot start a conversation with yourself' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const supabase = createClient();
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', recipient_id)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check if help request exists and is accessible (if provided)
    if (help_request_id) {
      const { data: helpRequest, error: helpError } = await supabase
        .from('help_requests')
        .select('id, user_id, status, title')
        .eq('id', help_request_id)
        .single();

      if (helpError || !helpRequest) {
        return NextResponse.json(
          { error: 'Help request not found' },
          { status: 404 }
        );
      }

      if (helpRequest.status !== 'open') {
        return NextResponse.json(
          { error: 'This help request is no longer open' },
          { status: 400 }
        );
      }

      // Ensure the recipient is the help request owner
      if (helpRequest.user_id !== recipient_id) {
        return NextResponse.json(
          { error: 'Invalid help request for this recipient' },
          { status: 400 }
        );
      }
    }

    // Check for existing conversation between these users for the same help request
    const existingConversationQuery = supabase
      .from('conversations')
      .select(`
        id,
        conversation_participants!inner(user_id)
      `)
      .eq('conversation_participants.user_id', user.id);

    if (help_request_id) {
      existingConversationQuery.eq('help_request_id', help_request_id);
    }

    const { data: existingConversations } = await existingConversationQuery;

    if (existingConversations && existingConversations.length > 0) {
      // Check if any existing conversation has both participants
      for (const conv of existingConversations) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .is('left_at', null);

        const participantIds = participants?.map(p => p.user_id) || [];
        if (participantIds.includes(recipient_id)) {
          return NextResponse.json(
            { 
              error: 'Conversation already exists',
              conversation_id: conv.id 
            },
            { status: 409 }
          );
        }
      }
    }

    // Create the conversation
    const conversation = await messagingClient.createConversation(user.id, validation.data);

    // Return success response with conversation details
    const conversationDetails = await messagingClient.getMessages(conversation.id, user.id, { limit: 1, direction: 'newer' });

    return NextResponse.json({
      conversation: conversationDetails.conversation,
      message: 'Conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Handle specific messaging errors
    if (error instanceof Error && error.message.includes('privacy settings')) {
      return NextResponse.json(
        { error: 'This user has restricted who can message them' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}