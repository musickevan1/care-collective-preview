import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/api/admin-auth';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/cms/calendar-events/[id]/publish
 * Publish a calendar event (set status to published)
 */
export async function POST(_request: NextRequest, segmentData: Params) {
  try {
    const adminUser = await getAdminUser();
    const { id } = await segmentData.params;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, event_categories(id, name, slug, color)')
      .single();

    if (error) {
      console.error('[Admin CMS Calendar] Error publishing event:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Calendar event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to publish calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: 'Calendar event published successfully',
    });
  } catch (error) {
    console.error('[Admin CMS Calendar] POST [id]/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
