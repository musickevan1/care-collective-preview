# Email Template Redesign - Planning Session Prompt

## Project Context

Care Collective is a mutual aid platform connecting community members for support and resources in Southwest Missouri. We need to redesign all email templates to be consistent, professional, accessible, and on-brand.

## Current State

We have 9 email templates that are functional but need professional design:

1. **Waitlist Confirmation** - Sent when user joins waitlist
2. **Application Approval** - Sent when application is approved with email confirmation link
3. **Application Rejection** - Sent when application is rejected with optional reason
4. **Help Request Notification** - Sent to potential helpers about new requests
5. **Help Offer Notification** - Sent when someone offers help on a request
6. **Account Activated** - Sent when user account is activated
7. **Account Suspended** - Sent when user account is suspended
8. **Moderation Alert** - Sent to admins for content reports (high/medium/low severity)
9. **Bulk Operation Summary** - Sent to admins after bulk operations

**Current Implementation**: Located in `lib/email-service.ts`

**Testing Endpoint**: `/api/admin/email-test` (can test all templates with sample data)

## Brand Guidelines

### Colors (from CLAUDE.md)

```css
--sage: #7A9E99;              /* Primary actions, headers */
--dusty-rose: #D8A8A0;        /* Secondary accent, subtle highlights */
--primary: #BC6547;           /* Terracotta - CTAs, important elements */
--secondary: #324158;         /* Navy - body text, headings */
--accent: #C39778;            /* Tan - borders, dividers */
--background: #FBF2E9;        /* Cream - email background */
--text: #483129;              /* Brown - body text */
```

### Typography

- **Font Family**: Overlock (accessible, approachable) - or fallback to Arial/sans-serif for email safety
- **Tone**: Warm, community-focused, inclusive, clear
- **Voice**: Supportive, trustworthy, human

### Logo & Branding

- **Domain**: swmocarecollective.org
- **Organization**: CARE Collective (Community Aid & Resource Exchange)
- **Geography**: Southwest Missouri (Springfield, Branson, Joplin)

## Design Requirements

### 1. Consistency Across All Templates

**Must Have:**
- Unified header with logo/brand name
- Consistent color palette usage
- Standard footer with links (Privacy Policy, Unsubscribe, Contact)
- Matching button styles
- Uniform spacing and typography hierarchy

### 2. Accessibility (WCAG 2.1 AA)

**Critical:**
- Color contrast ratio ≥ 4.5:1 for text
- Minimum 14px font size for body text
- Alt text for any images
- Semantic HTML structure
- Works without images (text-only version)
- Screen reader friendly
- Clear visual hierarchy

### 3. Mobile-First Design

**Requirements:**
- Responsive layout (single column preferred)
- Touch-friendly buttons (minimum 44px height)
- Readable on small screens
- Maximum width: 600px
- Works across email clients (Gmail, Outlook, Apple Mail, etc.)

### 4. Professional & Trustworthy

**Elements:**
- Clean, uncluttered design
- Professional logo header
- Secure/verified sender indicators
- Clear sender identification
- Contact information in footer

### 5. Community-Focused Feel

**Considerations:**
- Warm, welcoming visuals
- Human-centered language
- Emphasize mutual support
- Avoid corporate/cold aesthetics
- Balance professionalism with approachability

## Email Template Components

### Standard Header

- Logo or brand name
- Possibly: "CARE Collective" wordmark
- Background color: cream (#FBF2E9) or sage (#7A9E99)
- Centered or left-aligned

### Body Layout

- Clear visual hierarchy
- Section dividers (subtle, using accent color #C39778)
- Highlighted info boxes for important details
- Bullet points or numbered lists where appropriate
- Clear whitespace

### Call-to-Action Buttons

- Primary CTA: Terracotta (#BC6547) background, white text
- Secondary CTA: Sage (#7A9E99) or outline style
- Rounded corners (4-8px border-radius)
- Padding: 16px 32px
- Minimum 44px height

### Footer

**Must Include:**
- Organization name and location
- Privacy Policy link
- Contact information (support@swmocarecollective.org or admin@swmocarecollective.org)
- Unsubscribe link (if applicable)
- Copyright/year
- Optional: Social media links

**Style:**
- Light background or divider
- Small text (12px)
- Muted color (#999 or similar)

## Technical Constraints

### Email HTML Best Practices

- **Tables for layout** (CSS flexbox/grid not well supported)
- **Inline CSS** (external stylesheets often blocked)
- **Web-safe fonts** with fallbacks
- **Absolute URLs** for images (if used)
- **Alt text** for all images
- **Plain text fallback** version
- **Test across clients**: Gmail, Outlook, Apple Mail, Yahoo, ProtonMail

### Current Email Service

- **Provider**: Resend
- **Sender**: Uses Resend shared domain (onboarding@resend.dev) - may show "via resend.dev"
- **From Addresses**:
  - `noreply@swmocarecollective.org` (general notifications)
  - `admin@swmocarecollective.org` (admin communications)
- **Environment Variables**: FROM_EMAIL, ADMIN_EMAIL (currently unset, using fallback)

### File Location

- Email service: `lib/email-service.ts`
- Methods: `sendWaitlistConfirmation()`, `sendApprovalNotification()`, etc.
- Testing: `app/api/admin/email-test/route.ts`

## Email Template Specifications

### 1. Waitlist Confirmation

**Purpose**: Welcome new waitlist members, set expectations

**Key Elements:**
- Warm welcome message
- Explanation of waitlist process
- What happens next (timeline)
- How to prepare (optional)
- Contact for questions

**Tone**: Welcoming, encouraging, clear

**CTA**: None (informational only)

### 2. Application Approval

**Purpose**: Congratulate approved user, confirm email address

**Key Elements:**
- Congratulations message
- Email confirmation link (primary CTA)
- Next steps after confirmation
- Welcome to the community
- How to get started

**Tone**: Celebratory, welcoming, action-oriented

**CTA**: "Confirm Your Email" button (primary, urgent)

### 3. Application Rejection

**Purpose**: Respectfully inform of rejection, provide reason

**Key Elements:**
- Respectful rejection message
- Optional reason for rejection (if provided)
- Encourage reapplication if appropriate
- Contact for questions/appeals
- Thank them for interest

**Tone**: Respectful, empathetic, clear

**CTA**: None or "Contact Us" (secondary)

### 4. Help Request Notification

**Purpose**: Alert potential helpers about new request

**Key Elements:**
- Request title and brief description
- Category (groceries, transport, household, medical, other)
- Urgency level (normal, urgent, critical)
- Location (general area)
- "View Request" button

**Tone**: Urgent-but-calm, action-oriented, community-focused

**CTA**: "View Request" or "Offer Help" button (primary)

**Special Considerations:**
- Highlight urgency visually (color coding?)
- Keep brief (quick scan)
- No sensitive details

### 5. Help Offer Notification

**Purpose**: Notify requester that someone offered help

**Key Elements:**
- Who offered help (name)
- Request title reminder
- Helper's message preview
- "View Conversation" or "View Offer" button
- Response expectations

**Tone**: Positive, encouraging, action-oriented

**CTA**: "View Conversation" button (primary)

### 6. Account Activated

**Purpose**: Confirm account activation

**Key Elements:**
- Account activated confirmation
- What this means
- Next steps
- How to use the platform
- Quick start guide or tips

**Tone**: Welcoming, helpful, informative

**CTA**: "Go to Dashboard" or "Get Started" button

### 7. Account Suspended

**Purpose**: Inform user of suspension, provide reason and recourse

**Key Elements:**
- Clear suspension notice
- Reason for suspension
- Duration (if temporary)
- Appeal process or contact
- Community guidelines reference

**Tone**: Professional, clear, respectful-but-firm

**CTA**: "Contact Support" or "Review Guidelines" (secondary)

**Special Considerations:**
- Must be very clear about reason
- Provide path to resolution if possible
- Not punitive in tone

### 8. Moderation Alert (Admin)

**Purpose**: Alert admins to content requiring review

**Key Elements:**
- Severity indicator (high/medium/low)
- Report ID and message ID
- Reporter name
- Content preview (quoted/highlighted)
- Violation category (harassment, spam, etc.)
- "Review Report" button
- Quick action links if possible

**Tone**: Professional, urgent, informative

**CTA**: "Review Report" button (primary, color-coded by severity?)

**Special Considerations:**
- Visual severity indicators (colors, icons)
- High severity should stand out
- Include context

### 9. Bulk Operation Summary (Admin)

**Purpose**: Report results of bulk admin operations

**Key Elements:**
- Operation type (approval, rejection, etc.)
- Total count, successful count, failed count
- List of results with details
- Timestamp
- Performed by (admin name)

**Tone**: Professional, informative, data-focused

**CTA**: None or "View Full Report" (secondary)

**Special Considerations:**
- Scannable results list
- Distinguish success/failure visually
- Could be long - good truncation strategy

## Success Criteria

### Design Quality
- [ ] Looks professional and trustworthy
- [ ] Warm, community-focused aesthetic
- [ ] Consistent with web platform design
- [ ] All brand colors used appropriately

### Technical Quality
- [ ] Renders correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile responsive
- [ ] Passes WCAG 2.1 AA contrast checks
- [ ] Works with images disabled
- [ ] Valid HTML (table-based layout)
- [ ] Inline CSS only

### Content Quality
- [ ] Clear, scannable hierarchy
- [ ] Appropriate tone for each template
- [ ] Action-oriented where needed
- [ ] All necessary information included
- [ ] Concise (not overwhelming)

### Consistency
- [ ] All templates share visual language
- [ ] Standard header and footer
- [ ] Matching button styles
- [ ] Consistent spacing and typography
- [ ] Unified color usage

## Deliverables

1. **Email Template Components** (reusable HTML/React)
   - Header component
   - Footer component
   - Button component (primary/secondary)
   - Info box component
   - Section divider component

2. **Email Templates** (9 complete templates)
   - All templates redesigned with new components
   - Implemented in `lib/email-service.ts`
   - Sample data for testing

3. **Documentation**
   - Email design system guide
   - How to create new email templates
   - Testing checklist

4. **Testing Results**
   - Screenshots from major email clients
   - Accessibility audit results
   - Mobile responsiveness verification

## Resources

- **Current Code**: `lib/email-service.ts`
- **Testing Endpoint**: `/api/admin/email-test/route.ts`
- **Brand Guidelines**: `CLAUDE.md` (Design System section)
- **Test Command**: See testing section in this doc

## Testing

After implementation, test all templates using:

```javascript
// Browser console on https://swmocarecollective.org/admin
const templates = ['waitlist', 'approval', 'rejection', 'help_request', 'help_offer', 'user_activated', 'user_suspended', 'moderation_alert', 'bulk_operation'];

templates.forEach((template, i) => {
  setTimeout(() => {
    fetch('/api/admin/email-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, email: 'your-email@example.com' })
    }).then(r => r.json()).then(d => console.log(`${template}:`, d));
  }, i * 1000);
});
```

## Next Steps

1. **Research Phase**: Review email template best practices, accessibility guidelines, and email client compatibility
2. **Design Phase**: Create mockups/wireframes for each template
3. **Component Phase**: Build reusable email components (header, footer, buttons)
4. **Implementation Phase**: Implement all 9 templates with new design
5. **Testing Phase**: Test across email clients, accessibility, and mobile
6. **Refinement Phase**: Iterate based on testing results

---

**Goal**: Create professional, accessible, and beautifully consistent email templates that strengthen the Care Collective brand and improve user experience.
