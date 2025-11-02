import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for bug reports
const bugReportSchema = z.object({
  title: z.string().min(5).max(200),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['functionality', 'ui', 'performance', 'security', 'content']),
  description: z.string().min(10).max(2000),
  stepsToReproduce: z.string().max(2000).optional(),
  context: z.object({
    url: z.string(),
    userAgent: z.string(),
    screenSize: z.string(),
    viewport: z.string(),
    timestamp: z.string(),
  }),
});

// Validation schema for bug report updates
const bugReportUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'wont_fix']),
  resolutionNotes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bugReportSchema.parse(body);

    // Get user profile for additional context
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_beta_tester')
      .eq('id', user.id)
      .single();

    // Insert bug report into database
    const { data: bugReport, error: insertError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        severity: validatedData.severity,
        category: validatedData.category,
        description: validatedData.description,
        steps_to_reproduce: validatedData.stepsToReproduce,
        context: validatedData.context,
        reporter_name: profile?.name || 'Unknown',
        reporter_email: user.email,
        is_from_beta_tester: profile?.is_beta_tester || false,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Bug report insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save bug report' },
        { status: 500 }
      );
    }

    // TODO: Send notification to admin/developer
    // This could be an email, Slack message, or other notification system
    // For now, we'll just log it
    console.log('New bug report submitted:', {
      id: bugReport.id,
      title: bugReport.title,
      severity: bugReport.severity,
      reporter: profile?.name,
      isBeta: profile?.is_beta_tester,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Bug report submitted successfully',
        reportId: bugReport.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bug report API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bug report data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve bug reports (admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const severity = searchParams.get('severity');
    const isBeta = searchParams.get('beta') === 'true';

    // Build query
    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (isBeta) {
      query = query.eq('is_from_beta_tester', true);
    }

    const { data: bugReports, error: fetchError } = await query;

    if (fetchError) {
      console.error('Bug reports fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bug reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bugReports }, { status: 200 });
  } catch (error) {
    console.error('Bug report GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update bug reports (admin only)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bugReportUpdateSchema.parse(body);

    // Prepare update data
    const updateData: {
      status: string;
      resolution_notes?: string;
      resolved_at?: string;
      updated_at: string;
    } = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    };

    // Add resolution notes if provided
    if (validatedData.resolutionNotes !== undefined) {
      updateData.resolution_notes = validatedData.resolutionNotes;
    }

    // Set resolved_at timestamp if status is resolved
    if (validatedData.status === 'resolved' || validatedData.status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    // Update bug report in database
    const { data: updatedReport, error: updateError } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Bug report update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bug report' },
        { status: 500 }
      );
    }

    if (!updatedReport) {
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      );
    }

    console.log('Bug report updated:', {
      id: updatedReport.id,
      status: updatedReport.status,
      updatedBy: profile?.is_admin ? 'admin' : 'user',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Bug report updated successfully',
        bugReport: updatedReport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bug report PATCH API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
