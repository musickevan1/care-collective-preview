import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/api/admin-auth';

type Params = {
  params: Promise<{ key: string }>;
};

/**
 * POST /api/admin/cms/site-content/[key]/publish
 * Publish a site content section (move draft to published)
 */
export async function POST(_request: NextRequest, segmentData: Params) {
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

    const supabase = await createClient();

    // Get current section
    const { data: section, error: fetchError } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_key', key)
      .single();

    if (fetchError) {
      console.error('[Admin CMS] Error fetching site content for publish:', fetchError);
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Update section: set published version and mark as published
    const { data, error } = await supabase
      .from('site_content')
      .update({
        status: 'published',
        published_version: section.content, // Save current content as published version
        published_at: new Date().toISOString(),
        published_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('section_key', key)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error publishing site content:', error);
      return NextResponse.json(
        { error: 'Failed to publish site content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      section: data,
      message: 'Site content published successfully',
    });
  } catch (error) {
    console.error('[Admin CMS] POST [key]/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
