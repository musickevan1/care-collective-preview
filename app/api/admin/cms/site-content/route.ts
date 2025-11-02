import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAuth, getAdminUser } from '@/lib/api/admin-auth';
import { siteContentSchema } from '@/lib/validations/cms';
import { z } from 'zod';

/**
 * GET /api/admin/cms/site-content
 * Get all site content sections (mission, about, events_updates)
 */
export async function GET() {
  try {
    const authError = await requireAdminAuth();
    if (authError) return authError;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section_key', { ascending: true });

    if (error) {
      console.error('[Admin CMS] Error fetching site content:', error);
      return NextResponse.json(
        { error: 'Failed to fetch site content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sections: data });
  } catch (error) {
    console.error('[Admin CMS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cms/site-content
 * Create or update a site content section
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();

    const body = await request.json();
    const validated = siteContentSchema.parse(body);

    const supabase = await createClient();

    // Check if section already exists
    const { data: existing } = await supabase
      .from('site_content')
      .select('id')
      .eq('section_key', validated.section_key)
      .single();

    let data;
    let operation;

    if (existing) {
      // Update existing section
      const { data: updated, error } = await supabase
        .from('site_content')
        .update({
          content: validated.content,
          status: validated.status,
          updated_by: adminUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[Admin CMS] Error updating site content:', error);
        return NextResponse.json(
          { error: 'Failed to update site content' },
          { status: 500 }
        );
      }

      data = updated;
      operation = 'updated';
    } else {
      // Create new section
      const { data: created, error } = await supabase
        .from('site_content')
        .insert({
          section_key: validated.section_key,
          content: validated.content,
          status: validated.status,
          created_by: adminUser.id,
          updated_by: adminUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('[Admin CMS] Error creating site content:', error);
        return NextResponse.json(
          { error: 'Failed to create site content' },
          { status: 500 }
        );
      }

      data = created;
      operation = 'created';
    }

    return NextResponse.json({
      success: true,
      section: data,
      operation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin CMS] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
