/**
 * @fileoverview API endpoint for editing help requests
 * PUT /api/requests/[id]/edit - Update existing help request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { CATEGORY_VALUES } from '@/lib/constants/categories';

// Validation schema for edit requests (subset of create schema)
// Uses CATEGORY_VALUES from constants to stay in sync with database constraints
const editRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  subcategory: z.string().max(100).optional(),
  urgency: z.enum(['normal', 'urgent', 'critical']).optional(),
  location_override: z.string().max(200).optional(),
  location_privacy: z.enum(['public', 'helpers_only', 'after_match']).optional(),
  exchange_offer: z.string().max(300, 'Exchange offer too long').nullable().optional()
});

/**
 * PUT /api/requests/[id]/edit
 * Update an existing help request
 *
 * Permissions:
 * - Only the request owner can edit
 * - Can only edit requests with status 'open' or 'in_progress'
 * - Cannot edit completed or cancelled requests
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const debugLog = (step: string, data: Record<string, unknown>) => {
    console.log(`[REQUEST_EDIT_DEBUG] ${step}:`, {
      timestamp: new Date().toISOString(),
      requestId: params.id,
      ...data
    });
  };

  try {
    debugLog('START', { url: request.url });

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      debugLog('AUTH_FAILED', { error: authError?.message });
      return NextResponse.json(
        { error: 'Unauthorized', userMessage: 'You must be logged in to edit requests.' },
        { status: 401 }
      );
    }
    debugLog('AUTH_SUCCESS', { userId: user.id });

    const requestId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      debugLog('UUID_INVALID', { requestId });
      return NextResponse.json(
        { error: 'Invalid request ID format', userMessage: 'The request ID is not valid.' },
        { status: 400 }
      );
    }

    // Check if request exists and user is owner
    debugLog('FETCH_REQUEST', { requestId });
    const { data: existingRequest, error: fetchError } = await supabase
      .from('help_requests')
      .select('id, user_id, status, title')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      debugLog('REQUEST_NOT_FOUND', { error: fetchError?.message });
      return NextResponse.json(
        { error: 'Request not found', userMessage: 'This help request does not exist.' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingRequest.user_id !== user.id) {
      debugLog('PERMISSION_DENIED', { ownerId: existingRequest.user_id, userId: user.id });
      return NextResponse.json(
        {
          error: 'Permission denied',
          userMessage: 'You can only edit your own help requests.'
        },
        { status: 403 }
      );
    }

    // Check if request can be edited (must be open or in_progress)
    if (existingRequest.status === 'completed' || existingRequest.status === 'cancelled') {
      debugLog('INVALID_STATUS', { status: existingRequest.status });
      return NextResponse.json(
        {
          error: 'Cannot edit request',
          userMessage: `Cannot edit ${existingRequest.status} requests. You can reopen the request first if needed.`
        },
        { status: 400 }
      );
    }

    debugLog('PERMISSION_GRANTED', { status: existingRequest.status });

    // Parse and validate request body
    const body = await request.json();
    debugLog('BODY_PARSED', { fields: Object.keys(body) });

    const validation = editRequestSchema.safeParse(body);

    if (!validation.success) {
      debugLog('VALIDATION_FAILED', {
        errors: validation.error.issues.map(i => ({ path: i.path, message: i.message }))
      });
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
          userMessage: 'Please check your input and try again.'
        },
        { status: 400 }
      );
    }

    // Check if at least one field is being updated
    if (Object.keys(validation.data).length === 0) {
      debugLog('NO_CHANGES', {});
      return NextResponse.json(
        { error: 'No changes provided', userMessage: 'No fields were updated.' },
        { status: 400 }
      );
    }

    debugLog('VALIDATION_PASSED', { fieldsToUpdate: Object.keys(validation.data) });

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('help_requests')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          location
        )
      `)
      .single();

    if (updateError) {
      debugLog('UPDATE_FAILED', { error: updateError.message, code: updateError.code });
      console.error('[REQUEST_EDIT_ERROR] Database update failed:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update request',
          userMessage: 'Could not save your changes. Please try again.'
        },
        { status: 500 }
      );
    }

    debugLog('UPDATE_SUCCESS', { requestId, updatedFields: Object.keys(validation.data) });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Request updated successfully'
    }, { status: 200 });

  } catch (error) {
    const debugLog = (step: string, data: Record<string, unknown>) => {
      console.log(`[REQUEST_EDIT_DEBUG] ${step}:`, {
        timestamp: new Date().toISOString(),
        requestId: params.id,
        ...data
      });
    };

    debugLog('EXCEPTION_CAUGHT', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });

    console.error('[REQUEST_EDIT_ERROR] Unhandled exception:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        userMessage: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
