import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { communityUpdateSchema } from '@/lib/validations/cms';
import { z } from 'zod';

/**
 * GET /api/admin/cms/community-updates
 * Get all community updates ordered by display_order
 */
export async function GET() {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('community_updates')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Admin CMS] Error fetching community updates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community updates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ updates: data });
  } catch (error) {
    console.error('[Admin CMS] GET community updates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cms/community-updates
 * Create a new community update
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();

    const body = await request.json();
    const validated = communityUpdateSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('community_updates')
      .insert({
        title: validated.title,
        description: validated.description,
        icon: validated.icon,
        highlight_value: validated.highlight_value,
        display_order: validated.display_order,
        status: validated.status,
        created_by: adminUser.id,
        updated_by: adminUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error creating community update:', error);
      return NextResponse.json(
        { error: 'Failed to create community update' },
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

    console.error('[Admin CMS] POST community updates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
