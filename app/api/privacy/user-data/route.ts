/**
 * @fileoverview User Data Export API
 * GDPR-compliant data export functionality for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { captureError, captureWarning, addBreadcrumb } from '@/lib/error-tracking';

// Request schema for data export
const dataExportRequestSchema = z.object({
  request_type: z.enum(['full_export', 'contact_data_only', 'privacy_audit', 'sharing_history']),
  export_format: z.enum(['json', 'csv', 'pdf']).default('json'),
  include_deleted_data: z.boolean().default(false)
});

// Response schemas for different export types
const profileDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().nullable(),
  created_at: z.string(),
  verification_status: z.string(),
  contact_preferences: z.any().nullable()
});

const contactExchangeSchema = z.object({
  id: z.string(),
  request_id: z.string(),
  helper_id: z.string(),
  requester_id: z.string(),
  message: z.string().nullable(),
  consent_given: z.boolean(),
  status: z.string(),
  initiated_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  data_retention_until: z.string().nullable()
});

/**
 * GET /api/privacy/user-data - Get user's data export
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestType = searchParams.get('type') || 'full_export';
    const format = searchParams.get('format') || 'json';
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    // Validate request parameters
    const validatedRequest = dataExportRequestSchema.parse({
      request_type: requestType,
      export_format: format,
      include_deleted_data: includeDeleted
    });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    addBreadcrumb({
      message: 'Data export requested',
      category: 'privacy_api',
      level: 'info',
      data: {
        userId: user.id,
        requestType: validatedRequest.request_type,
        format: validatedRequest.export_format
      }
    });

    let exportData: any = {};

    switch (validatedRequest.request_type) {
      case 'full_export':
        exportData = await generateFullExport(supabase, user.id, validatedRequest.include_deleted_data);
        break;
      case 'contact_data_only':
        exportData = await generateContactDataExport(supabase, user.id, validatedRequest.include_deleted_data);
        break;
      case 'privacy_audit':
        exportData = await generatePrivacyAuditExport(supabase, user.id);
        break;
      case 'sharing_history':
        exportData = await generateSharingHistoryExport(supabase, user.id);
        break;
      default:
        throw new Error('Invalid export type');
    }

    // Add metadata to export
    const exportWithMetadata = {
      export_metadata: {
        user_id: user.id,
        export_type: validatedRequest.request_type,
        export_format: validatedRequest.export_format,
        generated_at: new Date().toISOString(),
        gdpr_compliant: true,
        includes_deleted_data: validatedRequest.include_deleted_data
      },
      data: exportData
    };

    // Handle different export formats
    if (validatedRequest.export_format === 'json') {
      return NextResponse.json(exportWithMetadata, {
        headers: {
          'Content-Disposition': `attachment; filename="care-collective-export-${user.id}-${Date.now()}.json"`,
          'Content-Type': 'application/json'
        }
      });
    } else if (validatedRequest.export_format === 'csv') {
      const csvData = convertToCSV(exportWithMetadata);
      return new NextResponse(csvData, {
        headers: {
          'Content-Disposition': `attachment; filename="care-collective-export-${user.id}-${Date.now()}.csv"`,
          'Content-Type': 'text/csv'
        }
      });
    } else {
      // PDF export would be implemented here
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      );
    }

  } catch (error) {
    console.error('Data export error:', error);
    captureError(error as Error, {
      component: 'UserDataAPI',
      action: 'GET_export',
      severity: 'high'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate data export' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/privacy/user-data - Request data export (async processing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedRequest = dataExportRequestSchema.parse(body);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate unique download token
    const downloadToken = crypto.getRandomValues(new Uint8Array(32))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    // Create export request record
    const { data: exportRequest, error: insertError } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        request_type: validatedRequest.request_type,
        export_format: validatedRequest.export_format,
        status: 'pending',
        download_token: downloadToken,
        requested_at: new Date().toISOString(),
        // File expires after 7 days
        file_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // In a production system, this would trigger background processing
    // For now, we'll process it immediately
    try {
      await processDataExportRequest(supabase, exportRequest.id, user.id, validatedRequest);
    } catch (processingError) {
      captureWarning('Data export processing failed', {
        component: 'UserDataAPI',
        exportRequestId: exportRequest.id,
        error: processingError instanceof Error ? processingError.message : 'Unknown error'
      });
    }

    addBreadcrumb({
      message: 'Data export request created',
      category: 'privacy_api',
      level: 'info',
      data: {
        userId: user.id,
        requestId: exportRequest.id,
        requestType: validatedRequest.request_type
      }
    });

    return NextResponse.json({
      message: 'Data export request created successfully',
      request_id: exportRequest.id,
      download_token: downloadToken,
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    }, { status: 201 });

  } catch (error) {
    console.error('Data export request error:', error);
    captureError(error as Error, {
      component: 'UserDataAPI',
      action: 'POST_request',
      severity: 'medium'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create data export request' },
      { status: 500 }
    );
  }
}

/**
 * Generate full data export for user
 */
async function generateFullExport(supabase: any, userId: string, includeDeleted: boolean) {
  const exportData: any = {};

  // Profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  exportData.profile = profile;

  // Help requests
  const { data: helpRequests } = await supabase
    .from('help_requests')
    .select('*')
    .eq('user_id', userId);

  exportData.help_requests = helpRequests;

  // Contact exchanges
  let contactQuery = supabase
    .from('contact_exchanges')
    .select('*')
    .or(`helper_id.eq.${userId},requester_id.eq.${userId}`);

  if (!includeDeleted) {
    contactQuery = contactQuery.neq('status', 'deleted');
  }

  const { data: contactExchanges } = await contactQuery;
  exportData.contact_exchanges = contactExchanges;

  // Privacy settings
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  exportData.privacy_settings = privacySettings;

  // Sharing history
  const { data: sharingHistory } = await supabase
    .from('contact_sharing_history')
    .select('*')
    .eq('user_id', userId);

  exportData.sharing_history = sharingHistory;

  // Audit logs (user-specific only)
  const { data: auditLogs } = await supabase
    .from('contact_exchange_audit')
    .select('*')
    .or(`helper_id.eq.${userId},requester_id.eq.${userId}`)
    .order('timestamp', { ascending: false })
    .limit(100);

  exportData.audit_logs = auditLogs;

  return exportData;
}

/**
 * Generate contact data only export
 */
async function generateContactDataExport(supabase: any, userId: string, includeDeleted: boolean) {
  let contactQuery = supabase
    .from('contact_exchanges')
    .select(`
      *,
      help_requests (
        id,
        title,
        category,
        urgency
      )
    `)
    .or(`helper_id.eq.${userId},requester_id.eq.${userId}`);

  if (!includeDeleted) {
    contactQuery = contactQuery.neq('status', 'deleted');
  }

  const { data: contactExchanges } = await contactQuery;

  // Remove sensitive encrypted data for export
  const sanitizedExchanges = contactExchanges?.map(exchange => ({
    ...exchange,
    encrypted_contact_data: exchange.encrypted_contact_data ? '[ENCRYPTED_DATA_PRESENT]' : null,
    contact_shared: exchange.contact_shared ? '[CONTACT_DATA_PRESENT]' : null
  }));

  return {
    contact_exchanges: sanitizedExchanges,
    total_exchanges: sanitizedExchanges?.length || 0
  };
}

/**
 * Generate privacy audit export
 */
async function generatePrivacyAuditExport(supabase: any, userId: string) {
  // Privacy settings
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Audit logs
  const { data: auditLogs } = await supabase
    .from('contact_exchange_audit')
    .select('*')
    .or(`helper_id.eq.${userId},requester_id.eq.${userId}`)
    .order('timestamp', { ascending: false });

  // GDPR compliance status
  const gdprStatus = {
    consent_given: privacySettings?.gdpr_consent_given || false,
    consent_date: privacySettings?.gdpr_consent_date,
    privacy_policy_version: privacySettings?.privacy_policy_version,
    data_retention_period: privacySettings?.auto_delete_exchanges_after_days || 90
  };

  return {
    privacy_settings: privacySettings,
    gdpr_compliance: gdprStatus,
    audit_trail: auditLogs,
    audit_summary: {
      total_actions: auditLogs?.length || 0,
      last_activity: auditLogs?.[0]?.timestamp,
      privacy_violations: auditLogs?.filter(log => log.action.includes('FAILED')).length || 0
    }
  };
}

/**
 * Generate sharing history export
 */
async function generateSharingHistoryExport(supabase: any, userId: string) {
  const { data: sharingHistory } = await supabase
    .from('contact_sharing_history')
    .select(`
      *,
      help_requests (
        id,
        title,
        category,
        urgency
      ),
      profiles!shared_with_user_id (
        id,
        name,
        location
      )
    `)
    .eq('user_id', userId)
    .order('shared_at', { ascending: false });

  return {
    sharing_history: sharingHistory,
    summary: {
      total_shares: sharingHistory?.length || 0,
      active_shares: sharingHistory?.filter(h => h.status === 'active').length || 0,
      revoked_shares: sharingHistory?.filter(h => h.status === 'revoked').length || 0,
      expired_shares: sharingHistory?.filter(h => h.status === 'expired').length || 0
    }
  };
}

/**
 * Process data export request (background processing simulation)
 */
async function processDataExportRequest(
  supabase: any,
  requestId: string,
  userId: string,
  validatedRequest: any
) {
  try {
    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', requestId);

    // Generate the export data
    let exportData: any = {};
    switch (validatedRequest.request_type) {
      case 'full_export':
        exportData = await generateFullExport(supabase, userId, validatedRequest.include_deleted_data);
        break;
      case 'contact_data_only':
        exportData = await generateContactDataExport(supabase, userId, validatedRequest.include_deleted_data);
        break;
      case 'privacy_audit':
        exportData = await generatePrivacyAuditExport(supabase, userId);
        break;
      case 'sharing_history':
        exportData = await generateSharingHistoryExport(supabase, userId);
        break;
    }

    // In production, this would upload to secure storage and provide download URL
    const mockFileUrl = `/api/privacy/downloads/${requestId}`;
    const fileSize = JSON.stringify(exportData).length;

    // Update request as completed
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        export_file_url: mockFileUrl,
        export_file_size_bytes: fileSize
      })
      .eq('id', requestId);

  } catch (error) {
    // Update request as failed
    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      })
      .eq('id', requestId);

    throw error;
  }
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: any): string {
  // Simple CSV conversion - in production, use a proper CSV library
  const rows: string[] = [];

  // Add metadata header
  rows.push('Export Metadata');
  rows.push(`User ID,${data.export_metadata.user_id}`);
  rows.push(`Export Type,${data.export_metadata.export_type}`);
  rows.push(`Generated At,${data.export_metadata.generated_at}`);
  rows.push('');

  // Add data sections
  Object.keys(data.data).forEach(section => {
    const sectionData = data.data[section];
    rows.push(section.toUpperCase());

    if (Array.isArray(sectionData)) {
      if (sectionData.length > 0) {
        // Add headers
        const headers = Object.keys(sectionData[0]);
        rows.push(headers.join(','));

        // Add data rows
        sectionData.forEach(item => {
          const values = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value).replace(/,/g, ';'); // Replace commas to avoid CSV issues
          });
          rows.push(values.join(','));
        });
      }
    } else if (typeof sectionData === 'object') {
      Object.keys(sectionData).forEach(key => {
        const value = sectionData[key];
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        rows.push(`${key},${displayValue}`);
      });
    }

    rows.push(''); // Empty line between sections
  });

  return rows.join('\n');
}