/**
 * @fileoverview API endpoints for messaging preferences
 * GET /api/messaging/preferences - Get user's messaging preferences
 * PUT /api/messaging/preferences - Update messaging preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { messagingClient } from '@/lib/messaging/client';
import { messagingValidation } from '@/lib/messaging/types';

export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * GET /api/messaging/preferences
 * Get the current user's messaging preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await messagingClient.getMessagingPreferences(user.id);

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching messaging preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messaging preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/messaging/preferences
 * Update the current user's messaging preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate the preferences data
    const validation = messagingValidation.messagingPreferences.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid preferences data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    // Validate quiet hours if provided
    const { quiet_hours_start, quiet_hours_end } = validation.data;
    if ((quiet_hours_start && !quiet_hours_end) || (!quiet_hours_start && quiet_hours_end)) {
      return NextResponse.json(
        { error: 'Both quiet hours start and end times must be provided together' },
        { status: 400 }
      );
    }

    // Validate time format and logic
    if (quiet_hours_start && quiet_hours_end) {
      const startTime = new Date(`2000-01-01T${quiet_hours_start}:00`);
      const endTime = new Date(`2000-01-01T${quiet_hours_end}:00`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid time format for quiet hours' },
          { status: 400 }
        );
      }
    }

    const updatedPreferences = await messagingClient.updateMessagingPreferences(
      user.id, 
      validation.data
    );

    return NextResponse.json({ 
      preferences: updatedPreferences,
      message: 'Messaging preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating messaging preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update messaging preferences' },
      { status: 500 }
    );
  }
}