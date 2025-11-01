/**
 * @fileoverview API endpoints for conversation messages
 * GET /api/messaging/conversations/[id]/messages - Get messages in conversation
 * POST /api/messaging/conversations/[id]/messages - Send new message
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingServiceV2 } from '@/lib/messaging/service-v2-server';
import { messagingValidation } from '@/lib/messaging/types';
import { moderationService } from '@/lib/messaging/moderation';
import { z } from 'zod';

// Rate limiting for message operations
const messageCounts = new Map<string, { count: number; resetTime: number }>();

function checkMessageRateLimit(userId: string, maxMessages: number = 50, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = messageCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    messageCounts.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxMessages) {
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
 * GET /api/messaging/conversations/[id]/messages
 * Get messages in a conversation with cursor-based pagination
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

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // V2: Get full conversation with messages using RPC
    const result = await messagingServiceV2.getConversation(conversationId, user.id);

    if (!result.success) {
      // Map V2 error codes to HTTP responses
      switch (result.error) {
        case 'not_found':
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        case 'access_denied':
          return NextResponse.json(
            { error: 'You do not have access to this conversation' },
            { status: 403 }
          );
        default:
          return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
          );
      }
    }

    return NextResponse.json({
      conversation: result.conversation,
      messages: result.messages || []
    });

  } catch (error) {
    console.error('Error fetching messages:', error);

    if (error instanceof Error && error.message.includes('access')) {
      return NextResponse.json(
        { error: 'You do not have access to this conversation' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messaging/conversations/[id]/messages
 * Send a new message in the conversation
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

    // Check user restrictions first
    const restrictionCheck = await moderationService.checkUserRestrictions(user.id, 'send_message');
    if (!restrictionCheck.allowed) {
      return NextResponse.json(
        {
          error: restrictionCheck.reason || 'You are restricted from sending messages.',
          restriction_level: restrictionCheck.restrictionLevel,
          daily_count: restrictionCheck.dailyMessageCount,
          daily_limit: restrictionCheck.dailyLimit
        },
        { status: 403 }
      );
    }

    // Check rate limit for sending messages
    if (!checkMessageRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'You are sending messages too quickly. Please slow down.' },
        { status: 429 }
      );
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate message content
    const validation = z.object({
      content: messagingValidation.sendMessage.shape.content,
      message_type: messagingValidation.sendMessage.shape.message_type.optional()
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Basic content moderation - check for prohibited content
    const content = validation.data.content.trim();
    if (containsProhibitedContent(content)) {
      return NextResponse.json(
        { error: 'Message contains prohibited content. Please revise your message.' },
        { status: 400 }
      );
    }

    // Send the message using V2 RPC
    const result = await messagingServiceV2.sendMessage({
      conversation_id: conversationId,
      sender_id: user.id,
      content: validation.data.content
    });

    if (!result.success) {
      // Map V2 error codes to HTTP responses
      switch (result.error) {
        case 'not_found':
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        case 'access_denied':
          return NextResponse.json(
            { error: 'You do not have access to this conversation' },
            { status: 403 }
          );
        case 'validation_error':
          return NextResponse.json(
            { error: result.message || 'Invalid message data' },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
          );
      }
    }

    // Get the message with sender details for response
    const supabase = await createClient();
    const { data: messageWithSender } = await supabase
      .from('messages_v2')
      .select(`
        *,
        sender:profiles!messages_v2_sender_id_fkey (
          id,
          name,
          location
        )
      `)
      .eq('id', result.message_id)
      .single();

    return NextResponse.json({
      message: messageWithSender,
      message_id: result.message_id,
      status: 'sent'
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof Error && error.message.includes('access')) {
      return NextResponse.json(
        { error: 'You do not have access to this conversation' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * Basic content moderation function
 * In production, this would integrate with a proper content moderation service
 */
function containsProhibitedContent(content: string): boolean {
  const prohibitedPatterns = [
    // Basic profanity filter (very limited - production would use proper service)
    /\b(fuck|shit|damn|hell)\b/gi,
    // Personal information patterns
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    // Suspicious URLs (allowing basic domains)
    /https?:\/\/(?!.*\b(youtube|google|facebook|twitter|instagram|linkedin)\b).*/gi
  ];

  return prohibitedPatterns.some(pattern => pattern.test(content));
}

/**
 * PUT /api/messaging/conversations/[id]/messages/[messageId]/read
 * Mark a specific message as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');
    
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

    // V2: Update messages_v2 table directly
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('messages_v2')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', user.id) // Only recipient can mark as read
      .is('read_at', null); // Only update if not already read

    if (updateError) {
      throw new Error('Failed to mark message as read');
    }

    return NextResponse.json({
      message: 'Message marked as read',
      read_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking message as read:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Message not found or you do not have permission to mark it as read' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}