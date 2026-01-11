import { NextRequest, NextResponse } from 'next/server'
import {
  approvalTemplate,
  helpRequestTemplate,
  moderationAlertTemplate,
  waitlistTemplate,
  rejectionTemplate,
  helpOfferTemplate,
  userActivatedTemplate,
  userSuspendedTemplate,
  bulkOperationSummaryTemplate,
  type EmailTemplate,
} from '@/lib/email/templates'
import { validateEmailTemplate } from '@/lib/email/utils'

/**
 * Email Preview API
 *
 * GET /api/email/preview
 *   Returns list of available templates
 *
 * GET /api/email/preview?template=<name>
 *   Returns HTML preview of the specified template
 *
 * GET /api/email/preview?template=<name>&format=json
 *   Returns JSON with html, text, subject, and validation results
 *
 * GET /api/email/preview?template=<name>&format=text
 *   Returns plain text version
 */

interface TemplateConfig {
  name: string
  description: string
  generate: () => EmailTemplate
}

const TEMPLATES: Record<string, TemplateConfig> = {
  approval: {
    name: 'Approval Notification',
    description: 'Sent when user application is approved',
    generate: () =>
      approvalTemplate('Jane Doe', 'https://swmocarecollective.com/confirm?token=abc123'),
  },
  waitlist: {
    name: 'Waitlist Confirmation',
    description: 'Sent when user joins the waitlist',
    generate: () => waitlistTemplate('John Smith'),
  },
  helpRequest: {
    name: 'Help Request Notification',
    description: 'Sent to potential helpers about new requests',
    generate: () =>
      helpRequestTemplate(
        'Helper Jane',
        'Need help with grocery shopping',
        'https://swmocarecollective.com/requests/123',
        'groceries',
        'urgent'
      ),
  },
  helpRequestCritical: {
    name: 'Help Request (Critical)',
    description: 'Critical urgency help request notification',
    generate: () =>
      helpRequestTemplate(
        'Helper Jane',
        'Emergency: Medical appointment transport needed',
        'https://swmocarecollective.com/requests/456',
        'medical',
        'critical'
      ),
  },
  helpOffer: {
    name: 'Help Offer Notification',
    description: 'Sent when someone offers to help with a request',
    generate: () =>
      helpOfferTemplate('Request Author', 'Helpful Neighbor', 'Need help with grocery shopping', 'req-123'),
  },
  rejection: {
    name: 'Rejection Notification',
    description: 'Sent when application is rejected',
    generate: () =>
      rejectionTemplate('John Doe', 'Unable to verify community connection at this time'),
  },
  userActivated: {
    name: 'User Activated',
    description: 'Sent when user account is activated',
    generate: () => userActivatedTemplate('Active User'),
  },
  userSuspended: {
    name: 'User Suspended',
    description: 'Sent when user account is suspended',
    generate: () => userSuspendedTemplate('Suspended User', 'Violation of community guidelines'),
  },
  moderation: {
    name: 'Moderation Alert',
    description: 'Sent to admins for content moderation',
    generate: () =>
      moderationAlertTemplate(
        'rpt-abc123',
        'msg-xyz789',
        'Inappropriate content',
        'reporter@example.com',
        'offending.user@example.com',
        'This is a preview of the flagged message content that was reported by a community member...',
        'high',
        'https://swmocarecollective.com/admin/moderation/reports/rpt-abc123'
      ),
  },
  bulkOperation: {
    name: 'Bulk Operation Summary',
    description: 'Sent to admins after bulk operations',
    generate: () =>
      bulkOperationSummaryTemplate('Admin User', 'User Status Update', 50, 48, 2, [
        'Updated 48 users to approved status',
        'Failed: 2 users had invalid email addresses',
      ]),
  },
}

function generateIndexPage(): string {
  const templateList = Object.entries(TEMPLATES)
    .map(
      ([key, config]) => `
      <li>
        <a href="/api/email/preview?template=${key}">${config.name}</a>
        <span class="description">${config.description}</span>
        <div class="links">
          <a href="/api/email/preview?template=${key}" class="preview-link">HTML</a>
          <a href="/api/email/preview?template=${key}&format=text" class="preview-link">Text</a>
          <a href="/api/email/preview?template=${key}&format=json" class="preview-link">JSON</a>
        </div>
      </li>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template Preview - CARE Collective</title>
  <link href="https://fonts.googleapis.com/css2?family=Overlock:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Overlock', system-ui, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #FBF2E9;
      color: #483129;
    }
    header {
      background: #5A7E79;
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      border-bottom: 4px solid #D8A8A0;
    }
    h1 { margin: 0 0 10px 0; font-weight: 900; font-size: 28px; }
    header p { margin: 0; opacity: 0.9; }
    .template-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .template-list li {
      background: white;
      margin: 12px 0;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #BC6547;
    }
    .template-list a {
      color: #BC6547;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
    }
    .template-list a:hover { text-decoration: underline; }
    .description {
      display: block;
      color: #666;
      font-size: 14px;
      margin-top: 6px;
    }
    .links {
      margin-top: 12px;
      display: flex;
      gap: 12px;
    }
    .preview-link {
      font-size: 13px !important;
      padding: 6px 12px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #324158 !important;
      font-weight: 600 !important;
    }
    .preview-link:hover {
      background: #e5e5e5;
      text-decoration: none !important;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      border-left: 4px solid #324158;
    }
    .info-box h3 { margin: 0 0 12px 0; color: #324158; }
    .info-box code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    .info-box pre {
      background: #324158;
      color: #fff;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Email Template Preview</h1>
    <p>CARE Collective email templates with live preview</p>
  </header>

  <ul class="template-list">
    ${templateList}
  </ul>

  <div class="info-box">
    <h3>API Usage</h3>
    <p>You can also access templates programmatically:</p>
    <pre>
# List all templates
GET /api/email/preview

# Get HTML preview
GET /api/email/preview?template=approval

# Get plain text version
GET /api/email/preview?template=approval&format=text

# Get JSON with validation
GET /api/email/preview?template=approval&format=json
    </pre>
    <p style="margin-top: 15px; font-size: 14px; color: #666;">
      For Supabase auth emails, use <code>supabase start</code> and visit
      <a href="http://localhost:54324" style="color: #BC6547;">http://localhost:54324</a> (Inbucket)
    </p>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateKey = searchParams.get('template')
  const format = searchParams.get('format') || 'html'

  // If no template specified, return index page
  if (!templateKey) {
    return new NextResponse(generateIndexPage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Validate template exists
  const config = TEMPLATES[templateKey]
  if (!config) {
    return NextResponse.json(
      {
        error: 'Template not found',
        available: Object.keys(TEMPLATES),
      },
      { status: 404 }
    )
  }

  // Generate template
  const template = config.generate()

  // Return based on format
  switch (format) {
    case 'json': {
      const validation = validateEmailTemplate(template.html)
      return NextResponse.json({
        name: config.name,
        description: config.description,
        subject: template.subject,
        html: template.html,
        text: template.text,
        validation,
        htmlLength: template.html.length,
        textLength: template.text.length,
      })
    }

    case 'text':
      return new NextResponse(template.text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })

    case 'html':
    default:
      return new NextResponse(template.html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
  }
}
