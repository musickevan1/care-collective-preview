# Phase 4: Cleanup & New Features

**Commit Message**: `feat: Add email notifications, remove crisis page, cleanup`

---

## Overview

This phase handles cleanup and new features:
1. Delete Crisis Resources page
2. Update internal links pointing to removed page
3. Add email notifications for help offers
4. Final QA pass

---

## 4.1 Delete Crisis Resources Page

### Client Request
> Let's do this: In the "Need Immediate Support?" section of the Community Resources page, let's add four crisis lines and remove the link to the extra page. (I'm so sorry!)

### Action Required
Delete the file: `/app/crisis-resources/page.tsx`

```bash
rm care-collective-preview/app/crisis-resources/page.tsx

# Also delete the directory if it becomes empty
rmdir care-collective-preview/app/crisis-resources/
```

### Rationale
- Crisis information now embedded directly in Community Resources page (Phase 3)
- Reduces navigation complexity
- Single source of truth for crisis resources

---

## 4.2 Update Internal Links

### Files to Check for Crisis Resources Links

Search for any links to `/crisis-resources`:
```bash
grep -r "crisis-resources" --include="*.ts" --include="*.tsx" care-collective-preview/
```

### Expected Files with Links

#### `/app/resources/page.tsx`
Already updated in Phase 3 - link removed.

#### `/app/help/page.tsx`
Already updated in Phase 3 - "Need Immediate Support?" section removed.

#### `/components/MobileNav.tsx`
Check if navigation includes crisis resources link:
```tsx
// If found, remove:
<Link href="/crisis-resources">Crisis Resources</Link>
```

#### Any other files
Update or remove any discovered links to `/crisis-resources`.

### Link Audit Checklist
- [ ] `/app/resources/page.tsx` - Link removed (Phase 3)
- [ ] `/app/help/page.tsx` - Section removed (Phase 3)
- [ ] `/components/MobileNav.tsx` - Check and remove if present
- [ ] Footer navigation - Check and remove if present
- [ ] Any metadata/SEO references

---

## 4.3 Email Notifications for Help Offers

### Client Request
> If I create a request, do I need to keep logging in and checking to see if someone responded or is there a way to link this to my email?

### Current State
- In-app notification created via `notifyHelpRequestOffer()`
- No email sent when someone offers help
- Location: `/app/api/messaging/help-requests/[id]/start-conversation/route.ts`

### Implementation Plan

#### 1. Add Email Notification Function to `/lib/email-service.ts`

```typescript
/**
 * Send email notification when someone offers help on a request
 */
export async function sendHelpOfferEmailNotification(
  recipientEmail: string,
  recipientName: string,
  helperName: string,
  requestTitle: string,
  requestId: string
): Promise<boolean> {
  const subject = `Someone wants to help with your request!`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Help Offer Notification</title>
    </head>
    <body style="font-family: 'Overlock', Arial, sans-serif; background-color: #FBF2E9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #324158; margin-bottom: 20px;">
          Good news, ${recipientName}!
        </h1>

        <p style="color: #483129; font-size: 16px; line-height: 1.6;">
          <strong>${helperName}</strong> has offered to help with your request:
        </p>

        <div style="background-color: #E9DDD4; border-left: 4px solid #BC6547; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #324158; font-weight: bold; margin: 0;">
            "${requestTitle}"
          </p>
        </div>

        <p style="color: #483129; font-size: 16px; line-height: 1.6;">
          You can now message them directly to coordinate assistance.
        </p>

        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/messages?help_request=${requestId}"
           style="display: inline-block; background-color: #7A9E99; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">
          View Messages
        </a>

        <hr style="border: none; border-top: 1px solid #E9DDD4; margin: 30px 0;">

        <p style="color: #483129; font-size: 14px;">
          CARE Collective - Southwest Missouri's mutual support network
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
Good news, ${recipientName}!

${helperName} has offered to help with your request: "${requestTitle}"

You can now message them directly to coordinate assistance.

View your messages: ${process.env.NEXT_PUBLIC_SITE_URL}/messages?help_request=${requestId}

---
CARE Collective - Southwest Missouri's mutual support network
  `;

  try {
    // Use existing email sending mechanism
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
        text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send help offer email:', error);
    return false;
  }
}
```

#### 2. Update API Route to Trigger Email

**File**: `/app/api/messaging/help-requests/[id]/start-conversation/route.ts`

```typescript
// After creating the in-app notification (around line 336-346)

// Import the new function
import { sendHelpOfferEmailNotification } from '@/lib/email-service';

// Inside the route handler, after notifyHelpRequestOffer():

// Get request owner's email
const { data: requestOwner } = await supabase
  .from('profiles')
  .select('email, name')
  .eq('id', helpRequest.user_id)
  .single();

// Send email notification (fire and forget)
if (requestOwner?.email) {
  sendHelpOfferEmailNotification(
    requestOwner.email,
    requestOwner.name || 'CARE Member',
    helperProfile.name || 'A community member',
    helpRequest.title,
    helpRequest.id
  ).catch(err => console.error('Email notification failed:', err));
}
```

### Email Content Alignment

The email follows client branding:
- Uses "CARE Collective" (all caps)
- Uses "mutual support" (not "mutual aid")
- Uses brand colors (cream background, almond highlight, terra cotta border)
- Links directly to messages with the help request context

---

## 4.4 Final QA Pass

### Link Verification
```bash
# Find all internal links and verify they work
grep -roh "href=\"/[^\"]*\"" --include="*.tsx" care-collective-preview/ | sort | uniq
```

### Expected Working Links
- `/` (home)
- `/about`
- `/resources`
- `/help`
- `/login`
- `/signup`
- `/dashboard`
- `/messages`
- `/requests`
- `/terms`
- `/privacy-policy`
- `/privacy-settings`

### Expected Removed Links
- `/crisis-resources` - Should no longer exist anywhere

### Build Verification
```bash
npm run build
npm run type-check
npm run lint
```

### Manual Testing Checklist
- [ ] Landing page loads with cream background
- [ ] All section dividers visible (terra cotta)
- [ ] How It Works boxes are almond color
- [ ] Why Join section has new content
- [ ] About section restructured
- [ ] Footer shows Dr. Templeman's name
- [ ] Join page has required Location and "Why join" fields
- [ ] Community Resources shows 4 crisis lines directly
- [ ] Help page is simplified
- [ ] No links to `/crisis-resources` exist
- [ ] Email notification sent when help is offered (test in dev)

---

## Files Modified in This Phase

| File | Type of Change |
|------|----------------|
| `/app/crisis-resources/page.tsx` | DELETE |
| `/lib/email-service.ts` | Add help offer email function |
| `/app/api/messaging/help-requests/[id]/start-conversation/route.ts` | Trigger email |
| Various files | Remove crisis-resources links |

**Total Files**: 4 (+ any with crisis links)
**Estimated Edits**: ~15

---

## Rollback Plan

If issues are discovered after deployment:

### Restore Crisis Resources Page
```bash
git checkout HEAD~1 -- care-collective-preview/app/crisis-resources/page.tsx
```

### Disable Email Notifications
Comment out the email sending code in the API route until fixed.

---

## Post-Implementation Tasks

1. **Monitor email delivery** - Check logs for email send failures
2. **User feedback** - Confirm email notifications are received
3. **Analytics** - Track engagement with email links
4. **Documentation** - Update user guides if they reference crisis resources page

---

## Complete Implementation Summary

| Phase | Commit | Status |
|-------|--------|--------|
| 1 | `fix: Update branding - CARE caps, mutual support terminology, new colors` | Pending |
| 2 | `feat: Landing page redesign per client feedback` | Pending |
| 3 | `feat: Update individual pages per client feedback` | Pending |
| 4 | `feat: Add email notifications, remove crisis page, cleanup` | Pending |

**Total Commits**: 4
**Total Files Modified**: 12
**Total Files Deleted**: 1
**Estimated Total Edits**: ~105
