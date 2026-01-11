/**
 * Notifications API Route
 * GET /api/notifications - List notifications for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { notificationQuerySchema } from '@/lib/validations';
import { Logger } from '@/lib/logger';

// Force dynamic rendering for authenticated API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters with Zod
    const searchParams = request.nextUrl.searchParams;
    const queryResult = notificationQuerySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      unread_only: searchParams.get('unread_only') ?? undefined,
    });

    if (!queryResult.success) {
      const errors = queryResult.error.issues.map(i => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { limit, offset, unread_only } = queryResult.data;

    // Fetch notifications
    const result = await NotificationService.getUserNotifications({
      limit,
      offset,
      unreadOnly: unread_only,
    });

    return NextResponse.json(result);
  } catch (error) {
    Logger.getInstance().error('[API /notifications] Error:', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
