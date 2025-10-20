import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Export data as CSV for admin analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const supabase = createClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const exportType = params.type

    let csvData: string
    let filename: string

    switch (exportType) {
      case 'users':
        csvData = await exportUsers(supabase)
        filename = `care-collective-users-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'requests':
        csvData = await exportHelpRequests(supabase)
        filename = `care-collective-requests-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'messages':
        csvData = await exportMessages(supabase)
        filename = `care-collective-messages-${new Date().toISOString().split('T')[0]}.csv`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Log admin action
    console.log(`[Admin API] Data export: ${exportType} by admin ${user.id}`)

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('[Admin API] Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function exportUsers(supabase: any): Promise<string> {
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      location,
      verification_status,
      is_admin,
      created_at,
      applied_at,
      approved_at,
      approved_by,
      rejection_reason
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to export users: ${error.message}`)
  }

  // CSV header
  const headers = [
    'ID',
    'Name',
    'Location',
    'Status',
    'Is Admin',
    'Created Date',
    'Applied Date',
    'Approved Date',
    'Approved By',
    'Rejection Reason'
  ]

  // Convert data to CSV
  const rows = users.map((user: any) => [
    user.id,
    escapeCsvField(user.name || ''),
    escapeCsvField(user.location || ''),
    user.verification_status || '',
    user.is_admin ? 'Yes' : 'No',
    formatDate(user.created_at),
    formatDate(user.applied_at),
    formatDate(user.approved_at),
    user.approved_by || '',
    escapeCsvField(user.rejection_reason || '')
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

async function exportHelpRequests(supabase: any): Promise<string> {
  const { data: requests, error } = await supabase
    .from('help_requests')
    .select(`
      id,
      title,
      description,
      category,
      urgency,
      status,
      location,
      created_at,
      closed_at,
      profiles!help_requests_user_id_fkey (
        name,
        location
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to export help requests: ${error.message}`)
  }

  // CSV header
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Urgency',
    'Status',
    'Location',
    'Requester Name',
    'Requester Location',
    'Created Date',
    'Closed Date',
    'Resolution Time (hours)'
  ]

  // Convert data to CSV
  const rows = requests.map((request: any) => {
    const resolutionHours = request.closed_at
      ? Math.round((new Date(request.closed_at).getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60) * 100) / 100
      : ''

    return [
      request.id,
      escapeCsvField(request.title || ''),
      escapeCsvField(request.description || ''),
      request.category || '',
      request.urgency || '',
      request.status || '',
      escapeCsvField(request.location || ''),
      escapeCsvField(request.profiles?.name || ''),
      escapeCsvField(request.profiles?.location || ''),
      formatDate(request.created_at),
      formatDate(request.closed_at),
      resolutionHours
    ]
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

async function exportMessages(supabase: any): Promise<string> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      encryption_status,
      moderation_status,
      is_flagged,
      flagged_reason,
      created_at,
      read_at,
      sender:profiles!messages_sender_id_fkey (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10000) // Limit for performance

  if (error) {
    throw new Error(`Failed to export messages: ${error.message}`)
  }

  // Get message reports
  const { data: reports } = await supabase
    .from('message_reports')
    .select('message_id, report_reason, status')

  const reportsByMessage = reports?.reduce((acc: any, report: any) => {
    if (!acc[report.message_id]) acc[report.message_id] = []
    acc[report.message_id].push(report)
    return acc
  }, {}) || {}

  // CSV header
  const headers = [
    'ID',
    'Conversation ID',
    'Sender Name',
    'Content Preview',
    'Message Type',
    'Encryption Status',
    'Moderation Status',
    'Is Flagged',
    'Flagged Reason',
    'Reports Count',
    'Report Reasons',
    'Created Date',
    'Read Date'
  ]

  // Convert data to CSV
  const rows = messages.map((message: any) => {
    const messageReports = reportsByMessage[message.id] || []
    const reportReasons = messageReports.map((r: any) => r.report_reason).join('; ')

    return [
      message.id,
      message.conversation_id,
      escapeCsvField(message.sender?.name || 'Unknown'),
      escapeCsvField(message.content ? message.content.substring(0, 100) + '...' : ''),
      message.message_type || '',
      message.encryption_status || '',
      message.moderation_status || '',
      message.is_flagged ? 'Yes' : 'No',
      escapeCsvField(message.flagged_reason || ''),
      messageReports.length,
      escapeCsvField(reportReasons),
      formatDate(message.created_at),
      formatDate(message.read_at)
    ]
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0] // YYYY-MM-DD format
}