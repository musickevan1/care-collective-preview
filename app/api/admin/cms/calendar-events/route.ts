import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { calendarEventSchema } from '@/lib/validations/cms';

/**
 * GET /api/admin/cms/calendar-events
 * Retrieve calendar events with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');

    const supabase = await createClient();
    let query = supabase
      .from('calendar_events')
      .select('*, event_categories(id, name, slug, color)');

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Order by start date descending (newest first)
    query = query.order('start_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[Admin CMS Calendar] Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data });
  } catch (error) {
    console.error('[Admin CMS Calendar] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cms/calendar-events
 * Create a new calendar event
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    const body = await request.json();
    const validated = calendarEventSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...validated,
        created_by: adminUser.id,
        updated_by: adminUser.id,
      })
      .select('*, event_categories(id, name, slug, color)')
      .single();

    if (error) {
      console.error('[Admin CMS Calendar] Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Calendar event created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS Calendar] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
