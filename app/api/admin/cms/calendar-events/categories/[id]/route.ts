import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { eventCategorySchema } from '@/lib/validations/cms';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/cms/calendar-events/categories/[id]
 * Retrieve a specific event category
 */
export async function GET(_request: NextRequest, segmentData: Params) {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const { id } = await segmentData.params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Admin CMS Categories] Error fetching category:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch event category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category: data });
  } catch (error) {
    console.error('[Admin CMS Categories] GET [id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cms/calendar-events/categories/[id]
 * Update an event category
 */
export async function PATCH(request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const body = await request.json();
    const validated = eventCategorySchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_categories')
      .update({
        ...validated,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS Categories] Error updating category:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event category not found' },
          { status: 404 }
        );
      }

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category name or slug already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update event category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Event category updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS Categories] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cms/calendar-events/categories/[id]
 * Soft delete an event category (set is_active = false)
 */
export async function DELETE(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const supabase = await createClient();
    // Soft delete: set is_active to false
    const { data, error } = await supabase
      .from('event_categories')
      .update({
        is_active: false,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS Categories] Error deleting category:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete event category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Event category deleted successfully',
    });
  } catch (error) {
    console.error('[Admin CMS Categories] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
