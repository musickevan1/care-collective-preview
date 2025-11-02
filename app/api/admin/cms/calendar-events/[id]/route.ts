import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { calendarEventSchema } from '@/lib/validations/cms';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/cms/calendar-events/[id]
 * Retrieve a specific calendar event
 */
export async function GET(_request: NextRequest, segmentData: Params) {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const { id } = await segmentData.params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*, event_categories(id, name, slug, color)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Admin CMS Calendar] Error fetching event:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    console.error('[Admin CMS Calendar] GET [id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cms/calendar-events/[id]
 * Update a calendar event
 */
export async function PATCH(request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const body = await request.json();
    const validated = calendarEventSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...validated,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, event_categories(id, name, slug, color)')
      .single();

    if (error) {
      console.error('[Admin CMS Calendar] Error updating event:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Calendar event updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS Calendar] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cms/calendar-events/[id]
 * Soft delete a calendar event (set status to archived)
 */
export async function DELETE(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const supabase = await createClient();
    // Soft delete: set status to archived
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        status: 'archived',
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, event_categories(id, name, slug, color)')
      .single();

    if (error) {
      console.error('[Admin CMS Calendar] Error deleting event:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Calendar event archived successfully',
    });
  } catch (error) {
    console.error('[Admin CMS Calendar] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
