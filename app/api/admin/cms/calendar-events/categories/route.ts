import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { eventCategorySchema } from '@/lib/validations/cms';

/**
 * GET /api/admin/cms/calendar-events/categories
 * Retrieve all event categories
 */
export async function GET() {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Admin CMS Categories] Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories: data });
  } catch (error) {
    console.error('[Admin CMS Categories] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cms/calendar-events/categories
 * Create a new event category
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    const body = await request.json();
    const validated = eventCategorySchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('event_categories')
      .insert({
        ...validated,
        created_by: adminUser.id,
        updated_by: adminUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS Categories] Error creating category:', error);

      // Handle unique constraint violations
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category name or slug already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create event category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Event category created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS Categories] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
