import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/api/admin-auth';

type Params = {
  params: Promise<{ section: string }>;
};

/**
 * POST /api/admin/cms/site-content/[section]/publish
 * Publish a site content section
 */
export async function POST(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { section } = await segmentData.params;

    const supabase = await createClient();

    // Get current content to save as published_version
    const { data: current } = await supabase
      .from('site_content')
      .select('content')
      .eq('section_key', section)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: 'Site content section not found' },
        { status: 404 }
      );
    }

    // Update to published status and save published version
    const { data, error } = await supabase
      .from('site_content')
      .update({
        status: 'published',
        published_version: current.content,
        published_at: new Date().toISOString(),
        published_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('section_key', section)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS Site Content] Error publishing:', error);
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
    console.error('[Admin CMS Site Content] POST [section]/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
