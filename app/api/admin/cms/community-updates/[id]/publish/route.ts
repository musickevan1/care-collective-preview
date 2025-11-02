import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/api/admin-auth';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/cms/community-updates/[id]/publish
 * Publish a community update
 */
export async function POST(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('community_updates')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin CMS] Error publishing community update:', error);
      return NextResponse.json(
        { error: 'Failed to publish community update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      update: data,
      message: 'Community update published successfully',
    });
  } catch (error) {
    console.error('[Admin CMS] POST [id]/publish community update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
