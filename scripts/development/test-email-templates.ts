#!/usr/bin/env npx tsx
/**
 * Email Template Test Script
 * Tests all CARE Collective email templates with actual template system
 *
 * Usage:
 *   npx tsx scripts/development/test-email-templates.ts [options]
 *
 * Options:
 *   --template <name>   Preview a specific template (approval, waitlist, helpRequest, etc.)
 *   --send              Send test email via Resend API (requires RESEND_API_KEY)
 *   --validate          Validate all templates for accessibility
 *   --list              List all available templates
 *   --all               Preview all templates (saves to /tmp/email-previews/)
 */

import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'

// Import all templates
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
} from '../../lib/email/templates'

import { validateEmailTemplate } from '../../lib/email/utils'

// Template definitions with sample data
interface TemplateConfig {
  name: string
  description: string
  generate: () => EmailTemplate
}

const TEMPLATES: Record<string, TemplateConfig> = {
  approval: {
    name: 'Approval Notification',
    description: 'Sent when user application is approved',
    generate: () => approvalTemplate('Jane Doe', 'https://swmocarecollective.com/confirm?token=abc123'),
  },
  waitlist: {
    name: 'Waitlist Confirmation',
    description: 'Sent when user joins the waitlist',
    generate: () => waitlistTemplate('John Smith'),
  },
  helpRequest: {
    name: 'Help Request Notification',
    description: 'Sent to potential helpers about new requests',
    generate: () => helpRequestTemplate(
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
    generate: () => helpRequestTemplate(
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
    generate: () => helpOfferTemplate(
      'Request Author',
      'Helpful Neighbor',
      'Need help with grocery shopping',
      'req-123'
    ),
  },
  rejection: {
    name: 'Rejection Notification',
    description: 'Sent when application is rejected',
    generate: () => rejectionTemplate('John Doe', 'Unable to verify community connection at this time'),
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
    generate: () => moderationAlertTemplate(
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
    generate: () => bulkOperationSummaryTemplate(
      'Admin User',
      'User Status Update',
      50,
      48,
      2,
      ['Updated 48 users to approved status', 'Failed: 2 users had invalid email addresses']
    ),
  },
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function listTemplates() {
  log('\n📧 Available Email Templates\n', 'cyan')
  log('─'.repeat(60), 'dim')

  Object.entries(TEMPLATES).forEach(([key, config]) => {
    log(`  ${key}`, 'green')
    log(`    ${config.name}`, 'reset')
    log(`    ${config.description}`, 'dim')
    console.log()
  })

  log('─'.repeat(60), 'dim')
  log(`\nTotal: ${Object.keys(TEMPLATES).length} templates`, 'blue')
}

function previewTemplate(templateKey: string) {
  const config = TEMPLATES[templateKey]
  if (!config) {
    log(`\n❌ Unknown template: ${templateKey}`, 'red')
    log('Use --list to see available templates', 'dim')
    process.exit(1)
  }

  log(`\n📧 Previewing: ${config.name}\n`, 'cyan')
  log('─'.repeat(60), 'dim')

  const template = config.generate()

  log(`Subject: ${template.subject}`, 'green')
  log(`HTML Length: ${template.html.length} characters`, 'dim')
  log(`Plain Text Length: ${template.text.length} characters`, 'dim')

  // Save to temp file for browser preview
  const previewDir = '/tmp/email-previews'
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true })
  }

  const htmlPath = path.join(previewDir, `${templateKey}.html`)
  const textPath = path.join(previewDir, `${templateKey}.txt`)

  fs.writeFileSync(htmlPath, template.html)
  fs.writeFileSync(textPath, template.text)

  log(`\n✅ Preview files saved:`, 'green')
  log(`   HTML: ${htmlPath}`, 'dim')
  log(`   Text: ${textPath}`, 'dim')
  log(`\n💡 Open in browser: file://${htmlPath}`, 'blue')

  // Show plain text preview
  log('\n📝 Plain Text Preview:\n', 'cyan')
  log('─'.repeat(60), 'dim')
  const textPreview = template.text.substring(0, 500)
  console.log(textPreview + (template.text.length > 500 ? '\n...(truncated)' : ''))
  log('─'.repeat(60), 'dim')
}

function previewAllTemplates() {
  const previewDir = '/tmp/email-previews'
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true })
  }

  log('\n📧 Generating All Template Previews\n', 'cyan')
  log('─'.repeat(60), 'dim')

  // Generate index.html
  let indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CARE Collective Email Templates</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #324158; }
    .template-list { list-style: none; padding: 0; }
    .template-list li { margin: 10px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .template-list a { color: #BC6547; text-decoration: none; font-weight: bold; font-size: 18px; }
    .template-list a:hover { text-decoration: underline; }
    .description { color: #666; font-size: 14px; margin-top: 5px; }
    .subject { color: #5A7E79; font-size: 13px; margin-top: 5px; font-style: italic; }
  </style>
</head>
<body>
  <h1>CARE Collective Email Templates</h1>
  <p>Preview all email templates used in the platform.</p>
  <ul class="template-list">
`

  Object.entries(TEMPLATES).forEach(([key, config]) => {
    const template = config.generate()
    const htmlPath = path.join(previewDir, `${key}.html`)
    const textPath = path.join(previewDir, `${key}.txt`)

    fs.writeFileSync(htmlPath, template.html)
    fs.writeFileSync(textPath, template.text)

    indexHtml += `    <li>
      <a href="${key}.html">${config.name}</a>
      <div class="description">${config.description}</div>
      <div class="subject">Subject: ${template.subject}</div>
    </li>\n`

    log(`  ✅ ${config.name}`, 'green')
  })

  indexHtml += `  </ul>
  <p style="color: #999; font-size: 12px; margin-top: 40px;">
    Generated: ${new Date().toISOString()}
  </p>
</body>
</html>`

  const indexPath = path.join(previewDir, 'index.html')
  fs.writeFileSync(indexPath, indexHtml)

  log('\n─'.repeat(60), 'dim')
  log(`\n✅ All ${Object.keys(TEMPLATES).length} templates saved to: ${previewDir}`, 'green')
  log(`\n💡 Open index: file://${indexPath}`, 'blue')
}

function validateTemplates() {
  log('\n🔍 Validating All Templates\n', 'cyan')
  log('─'.repeat(60), 'dim')

  let totalWarnings = 0
  let totalErrors = 0

  Object.entries(TEMPLATES).forEach(([key, config]) => {
    const template = config.generate()
    const result = validateEmailTemplate(template.html)

    const status = result.valid ? '✅' : '❌'
    log(`\n${status} ${config.name} (${key})`, result.valid ? 'green' : 'red')

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        log(`   ❌ Error: ${error}`, 'red')
        totalErrors++
      })
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        log(`   ⚠️  Warning: ${warning}`, 'yellow')
        totalWarnings++
      })
    }

    if (result.valid && result.warnings.length === 0) {
      log('   No issues found', 'dim')
    }
  })

  log('\n─'.repeat(60), 'dim')
  log(`\n📊 Summary:`, 'cyan')
  log(`   Templates: ${Object.keys(TEMPLATES).length}`, 'reset')
  log(`   Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green')
  log(`   Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green')

  if (totalErrors > 0) {
    process.exit(1)
  }
}

async function sendTestEmail(templateKey: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    log('\n❌ RESEND_API_KEY not found in environment', 'red')
    log('Set it in .env.local or export it directly', 'dim')
    process.exit(1)
  }

  const config = TEMPLATES[templateKey]
  if (!config) {
    log(`\n❌ Unknown template: ${templateKey}`, 'red')
    process.exit(1)
  }

  log(`\n📧 Sending Test Email: ${config.name}\n`, 'cyan')
  log('─'.repeat(60), 'dim')

  const template = config.generate()
  const resend = new Resend(apiKey)

  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev', // Resend's test email
      subject: `[TEST] ${template.subject}`,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      if (result.error.message?.includes('domain')) {
        log('⚠️  Domain verification needed (expected for development)', 'yellow')
        log('📧 API connection successful - domain setup required for production', 'green')
      } else {
        log(`❌ Resend error: ${result.error.message}`, 'red')
        process.exit(1)
      }
    } else {
      log(`✅ Email sent successfully!`, 'green')
      log(`   Message ID: ${result.data?.id}`, 'dim')
    }
  } catch (error) {
    log(`❌ Send failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red')
    process.exit(1)
  }
}

// Parse CLI arguments
const args = process.argv.slice(2)

async function main() {
  log('\n🧪 CARE Collective Email Template Tester', 'cyan')
  log('─'.repeat(60), 'dim')

  if (args.includes('--list') || args.includes('-l')) {
    listTemplates()
    return
  }

  if (args.includes('--validate') || args.includes('-v')) {
    validateTemplates()
    return
  }

  if (args.includes('--all') || args.includes('-a')) {
    previewAllTemplates()
    return
  }

  const templateIndex = args.findIndex(a => a === '--template' || a === '-t')
  if (templateIndex !== -1 && args[templateIndex + 1]) {
    const templateKey = args[templateIndex + 1]

    if (args.includes('--send') || args.includes('-s')) {
      await sendTestEmail(templateKey)
    } else {
      previewTemplate(templateKey)
    }
    return
  }

  // Default: show help
  log('\nUsage:', 'blue')
  log('  npx tsx scripts/development/test-email-templates.ts [options]', 'reset')
  log('\nOptions:', 'blue')
  log('  --list, -l              List all available templates', 'reset')
  log('  --template, -t <name>   Preview a specific template', 'reset')
  log('  --send, -s              Send test email (use with --template)', 'reset')
  log('  --validate, -v          Validate all templates', 'reset')
  log('  --all, -a               Generate all template previews', 'reset')
  log('\nExamples:', 'blue')
  log('  npx tsx scripts/development/test-email-templates.ts --list', 'dim')
  log('  npx tsx scripts/development/test-email-templates.ts -t approval', 'dim')
  log('  npx tsx scripts/development/test-email-templates.ts -t approval --send', 'dim')
  log('  npx tsx scripts/development/test-email-templates.ts --all', 'dim')
  log('  npx tsx scripts/development/test-email-templates.ts --validate', 'dim')
}

main().catch(console.error)
