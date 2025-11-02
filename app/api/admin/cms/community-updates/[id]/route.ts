import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { communityUpdateSchema } from '@/lib/validations/cms';
import { z } from 'zod';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/cms/community-updates/[id]
 * Get a specific community update by ID
 */
export async function GET(_request: NextRequest, segmentData: Params) {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const { id } = await segmentData.params;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('community_updates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Community update not found' },
          { status: 404 }
        );
      }

      console.error('[Admin CMS] Error fetching community update:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community update' },
        { status: 500 }
      );
    }

    return NextResponse.json({ update: data });
  } catch (error) {
    console.error('[Admin CMS] GET [id] community update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cms/community-updates/[id]
 * Update a community update
 */
export async function PATCH(request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const body = await request.json();
    const validated = communityUpdateSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('community_updates')
      .update({
        title: validated.title,
        description: validated.description,
        icon: validated.icon,
        highlight_value: validated.highlight_value,
        display_order: validated.display_order,
        status: validated.status,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error updating community update:', error);
      return NextResponse.json(
        { error: 'Failed to update community update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      update: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS] PATCH [id] community update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cms/community-updates/[id]
 * Delete (archive) a community update
 */
export async function DELETE(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const supabase = await createClient();

    // Soft delete: set status to archived
    const { data, error } = await supabase
      .from('community_updates')
      .update({
        status: 'archived',
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error deleting community update:', error);
      return NextResponse.json(
        { error: 'Failed to delete community update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      update: data,
      message: 'Community update archived successfully',
    });
  } catch (error) {
    console.error('[Admin CMS] DELETE [id] community update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
