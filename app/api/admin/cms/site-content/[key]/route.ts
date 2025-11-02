import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { siteContentSchema } from '@/lib/validations/cms';
import { z } from 'zod';

type Params = {
  params: Promise<{ key: string }>;
};

/**
 * GET /api/admin/cms/site-content/[key]
 * Get a specific site content section by key
 */
export async function GET(_request: NextRequest, segmentData: Params) {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const { key } = await segmentData.params;

    // Validate section key
    if (!['events_updates', 'mission', 'about'].includes(key)) {
      return NextResponse.json(
        { error: 'Invalid section key' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Section not found' },
          { status: 404 }
        );
      }

      console.error('[Admin CMS] Error fetching site content:', error);
      return NextResponse.json(
        { error: 'Failed to fetch site content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section: data });
  } catch (error) {
    console.error('[Admin CMS] GET [key] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/cms/site-content/[key]
 * Update a specific site content section
 */
export async function PATCH(request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { key } = await segmentData.params;

    // Validate section key
    if (!['events_updates', 'mission', 'about'].includes(key)) {
      return NextResponse.json(
        { error: 'Invalid section key' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = siteContentSchema.parse({
      ...body,
      section_key: key,
    });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_content')
      .update({
        content: validated.content,
        status: validated.status,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('section_key', key)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error updating site content:', error);
      return NextResponse.json(
        { error: 'Failed to update site content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      section: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS] PATCH [key] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
