/**
 * @fileoverview API endpoint for accepting pending help offers
 * POST /api/messaging/accept-offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Request validation schema
const acceptOfferSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format')
});

/**
 * Accept a pending help offer
 * Changes conversation status from 'pending' to 'accepted'
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { conversationId } = acceptOfferSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call accept_conversation RPC function
    const { data, error } = await supabase.rpc('accept_conversation', {
      p_conversation_id: conversationId,
      p_user_id: user.id
    });

    if (error) {
      console.error('[accept-offer] RPC error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Parse RPC result
    const result = data as { success: boolean; error?: string; message?: string };

    if (!result.success) {
      console.warn('[accept-offer] Business logic error:', {
        conversationId,
        userId: user.id,
        error: result.error
      });

      return NextResponse.json(
        { success: false, error: result.error || 'Failed to accept offer' },
        { status: 400 }
      );
    }

    // Success
    console.log('[accept-offer] Offer accepted successfully:', {
      conversationId,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      message: result.message || 'Offer accepted successfully'
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error('[accept-offer] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
