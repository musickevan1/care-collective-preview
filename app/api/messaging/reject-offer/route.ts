/**
 * @fileoverview API endpoint for rejecting pending help offers
 * POST /api/messaging/reject-offer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Request validation schema
const rejectOfferSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format'),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional()
});

/**
 * Reject a pending help offer
 * Changes conversation status from 'pending' to 'rejected'
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { conversationId, reason } = rejectOfferSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call reject_conversation RPC function
    const { data, error } = await supabase.rpc('reject_conversation', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_reason: reason || null
    });

    if (error) {
      console.error('[reject-offer] RPC error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Parse RPC result
    const result = data as { success: boolean; error?: string; message?: string };

    if (!result.success) {
      console.warn('[reject-offer] Business logic error:', {
        conversationId,
        userId: user.id,
        error: result.error
      });

      return NextResponse.json(
        { success: false, error: result.error || 'Failed to reject offer' },
        { status: 400 }
      );
    }

    // Success
    console.log('[reject-offer] Offer rejected successfully:', {
      conversationId,
      userId: user.id,
      hasReason: !!reason
    });

    return NextResponse.json({
      success: true,
      message: result.message || 'Offer declined successfully'
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
    console.error('[reject-offer] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
