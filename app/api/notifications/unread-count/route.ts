/**
 * Notifications Unread Count API Route
 * GET /api/notifications/unread-count - Get unread notification count
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/lib/notifications/NotificationService';

// Force dynamic rendering for authenticated API routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unread count
    const count = await NotificationService.getUnreadCount();

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[API /notifications/unread-count] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
