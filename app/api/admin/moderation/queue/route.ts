/**
 * @fileoverview API endpoint for moderation queue management
 * GET /api/admin/moderation/queue - Get pending moderation items and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderationService } from '@/lib/messaging/moderation';
import { requireAdminAuth } from '@/lib/api/admin-auth';

/**
 * GET /api/admin/moderation/queue
 * Get moderation queue items and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify admin access using proper authentication
    const user = await requireAdminAuth();
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Validate pagination parameters
    if (limit < 1 || limit > 100 || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get moderation queue items
    const queueItems = await moderationService.getModerationQueue(limit);

    // Get moderation statistics
    const supabase = await createClient();

    // Total pending reports
    const { count: totalPending } = await supabase
      .from('message_reports')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    // Today's statistics
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: processedToday },
      { count: dismissedToday },
      { count: actionsTakenToday }
    ] = await Promise.all([
      supabase
        .from('message_reports')
        .select('*', { count: 'exact' })
        .in('status', ['dismissed', 'action_taken'])
        .gte('reviewed_at', `${today}T00:00:00Z`),

      supabase
        .from('message_reports')
        .select('*', { count: 'exact' })
        .eq('status', 'dismissed')
        .gte('reviewed_at', `${today}T00:00:00Z`),

      supabase
        .from('message_reports')
        .select('*', { count: 'exact' })
        .eq('status', 'action_taken')
        .gte('reviewed_at', `${today}T00:00:00Z`)
    ]);

    // Calculate average processing time (simplified - in production would be more sophisticated)
    const { data: recentProcessed } = await supabase
      .from('message_reports')
      .select('created_at, reviewed_at')
      .not('reviewed_at', 'is', null)
      .gte('reviewed_at', `${today}T00:00:00Z`)
      .limit(20);

    let averageProcessingTime = 0;
    if (recentProcessed && recentProcessed.length > 0) {
      const totalTime = recentProcessed.reduce((sum, report) => {
        const created = new Date(report.created_at).getTime();
        const reviewed = new Date(report.reviewed_at!).getTime();
        return sum + (reviewed - created);
      }, 0);

      averageProcessingTime = totalTime / recentProcessed.length / (1000 * 60); // Convert to minutes
    }

    const stats = {
      total_pending: totalPending || 0,
      total_processed_today: processedToday || 0,
      total_dismissed_today: dismissedToday || 0,
      total_actions_taken_today: actionsTakenToday || 0,
      average_processing_time: averageProcessingTime
    };

    return NextResponse.json({
      items: queueItems,
      stats,
      pagination: {
        limit,
        offset,
        total: queueItems.length
      }
    });

  } catch (error) {
    console.error('Error fetching moderation queue:', error);

    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/moderation/queue/bulk
 * Process multiple moderation items at once
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify admin access using proper authentication
    const user = await requireAdminAuth();
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { items, action, notes } = body;

    // Validate bulk action request
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Cannot process more than 50 items at once' },
        { status: 400 }
      );
    }

    const validActions = ['dismiss', 'hide_message', 'warn_user', 'restrict_user', 'ban_user'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required' },
        { status: 400 }
      );
    }

    // Process items in parallel (with concurrency limit)
    const results = [];
    const batchSize = 5; // Process 5 items at a time to avoid overwhelming the database

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (itemId: string) => {
          try {
            await moderationService.processModerationItem(
              itemId,
              action,
              user.id,
              notes
            );
            return { id: itemId, success: true };
          } catch (error) {
            return {
              id: itemId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      results.push(...batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      ));
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Log bulk action for audit purposes
    console.log('Bulk moderation action processed:', {
      action,
      adminId: user.id,
      totalItems: items.length,
      successful: successful.length,
      failed: failed.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Bulk action completed',
      results: {
        total: items.length,
        successful: successful.length,
        failed: failed.length,
        details: results
      }
    });

  } catch (error) {
    console.error('Error processing bulk moderation action:', error);

    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}