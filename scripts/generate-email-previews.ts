
import fs from 'fs';
import path from 'path';
import { approvalTemplate, helpRequestTemplate, moderationAlertTemplate } from '../lib/email/templates';

async function main() {
    console.log('Generating email previews...');

    const approval = approvalTemplate('Evan', 'https://carecollective.org/confirm?token=123');
    const help = helpRequestTemplate('Sarah', 'Groceries for elderly neighbor', 'https://carecollective.org/requests/123', 'supplies', 'urgent');
    const mod = moderationAlertTemplate('REP-123', 'MSG-456', 'Harassment', 'user@example.com', 'badactor@example.com', 'This is a preview of a reported message that contains inappropriate content...', 'high', 'https://carecollective.org/admin/reports/123');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Previews</title>
      <style>
        body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
        .preview-container { margin-bottom: 40px; border: 1px solid #ccc; background: white; }
        .preview-header { padding: 10px; background: #eee; border-bottom: 1px solid #ccc; font-weight: bold; }
        iframe { width: 100%; height: 600px; border: none; }
      </style>
    </head>
    <body>
      <h1>Email Template Previews</h1>
      
      <div class="preview-container">
        <div class="preview-header">Approval Template</div>
        <iframe srcdoc="${approval.html.replace(/"/g, '&quot;')}"></iframe>
      </div>

      <div class="preview-container">
        <div class="preview-header">Help Request Template (Urgent)</div>
        <iframe srcdoc="${help.html.replace(/"/g, '&quot;')}"></iframe>
      </div>

      <div class="preview-container">
        <div class="preview-header">Moderation Alert Template (High)</div>
        <iframe srcdoc="${mod.html.replace(/"/g, '&quot;')}"></iframe>
      </div>
    </body>
    </html>
  `;

    const outputPath = path.join(process.cwd(), 'public', 'email-preview.html');
    fs.writeFileSync(outputPath, html);
    console.log(`Preview generated at ${outputPath}`);
}

main().catch(console.error);
