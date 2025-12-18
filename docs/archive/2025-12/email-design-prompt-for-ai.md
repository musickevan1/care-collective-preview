# Email Template Design Prompt for AI Tools

Use this prompt with Gemini, ChatGPT, Claude, or other AI tools to explore different email template designs.

---

## Project Context

I'm designing email templates for **CARE Collective**, a mutual aid platform connecting community members for support and resources in Southwest Missouri. The platform helps people request and offer help with groceries, transportation, household tasks, medical assistance, and other needs.

**Mission**: Build stronger communities through mutual support, accessibility, and trust.

**Target Audience**: Diverse community members in Missouri (Springfield, Branson, Joplin area) - ranging from young adults to seniors, varied technical expertise, some with limited connectivity or older devices.

---

## Brand Guidelines

### Colors (WCAG 2.1 AA Verified)

```css
--sage: #7A9E99           /* Primary actions - White contrast: 4.51:1 ✓ */
--dusty-rose: #D8A8A0     /* Secondary accent, dividers */
--terracotta: #BC6547     /* Primary CTAs - White contrast: 4.65:1 ✓ */
--navy: #324158           /* Headings - Cream contrast: 8.4:1 ✓ */
--tan: #C39778            /* Borders, badges */
--cream: #FBF2E9          /* Background, info boxes */
--brown: #483129          /* Body text - Cream contrast: 10.1:1 ✓ */
```

**Additional Colors for Severity/Status:**
- Green: `#28A745` (success)
- Red: `#DC3545` (critical/error)
- Orange: `#FF8C00` (urgent)
- Yellow: `#FFC107` (warning)
- Gray: `#999999` (footer text)

### Typography

- **Primary Font**: Overlock (accessible, approachable)
- **Fallback**: Arial, Helvetica, sans-serif (web-safe for email clients)
- **Minimum Size**: 14px for body text, 16px recommended
- **Line Height**: 1.5 minimum for body text

### Tone & Voice

- **Warm** and welcoming, not corporate
- **Clear** and concise (crisis-friendly)
- **Inclusive** and supportive
- **Trustworthy** and professional
- **Human-centered** language

### Logo

Text-based only (no images):
- "CARE Collective"
- Tagline: "Community Aid & Resource Exchange"

---

## Technical Requirements (Email HTML)

### MUST HAVE:

1. **Table-based layout** - Flexbox/grid not supported in email clients
2. **Inline CSS only** - No `<style>` tags or external stylesheets
3. **Max width: 600px** - Standard email width
4. **Mobile-first, responsive** - Single column layout
5. **Accessible** - WCAG 2.1 AA compliant:
   - Color contrast ≥ 4.5:1 for text
   - Minimum 14px font size
   - 44px minimum touch targets for buttons
   - Semantic HTML structure
   - Alt text for any images
   - Works without images (text-only version)

6. **Cross-client compatibility**:
   - Gmail (web, mobile, iOS)
   - Outlook (desktop, web)
   - Apple Mail (macOS, iOS)
   - Yahoo Mail
   - Must work with images disabled

### Email Structure Template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>CARE Collective</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Overlock', Arial, Helvetica, sans-serif; background-color: #FBF2E9;">
  <!-- Preheader (hidden text for preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Preheader text here (50-100 characters)
  </div>

  <!-- Main email container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FBF2E9;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF;">
          <tr>
            <td style="padding: 0;">
              <!-- HEADER -->
              <!-- CONTENT -->
              <!-- FOOTER -->
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Design Challenge

**Design ONE of the following email templates** with your own creative style while maintaining:
- Brand colors and accessibility
- Technical email HTML requirements
- Warm, community-focused aesthetic
- Mobile-first responsive design

Choose one template to design:

---

### Option 1: Application Approval Email

**Sent when**: User's application is approved

**Key Elements:**
- Congratulations/celebration tone
- Email confirmation link (PRIMARY CTA)
- What happens after confirmation
- Benefits of joining the platform
- Link fallback for accessibility

**Content Structure:**
```
HEADER: CARE Collective branding

BODY:
- Congratulations heading
- "Your application has been approved!"
- Success/celebration box or visual element
- PRIMARY BUTTON: "Confirm Your Email & Get Started"
- What you can do section:
  • Create and respond to help requests
  • Connect with community members
  • Share resources and support
  • Build stronger community connections
- Link fallback (if button doesn't work)

FOOTER: Privacy Policy, Contact, Copyright
```

**Tone**: Celebratory, welcoming, action-oriented

---

### Option 2: Help Request Notification

**Sent when**: New help request matches helper's interests

**Key Elements:**
- Personalized greeting
- Request title and category
- Urgency indicator (normal/urgent/critical)
- Clear CTA to view and offer help
- Brief motivational message

**Content Structure:**
```
HEADER: CARE Collective branding

BODY:
- Personalized greeting: "Hi [Helper Name]!"
- "A new help request has been posted..."
- Request details box:
  - Title: [Request Title]
  - Category badge (groceries/transport/household/medical/other)
  - Urgency level (if urgent/critical, highlight visually)
- PRIMARY BUTTON: "View Request & Offer Help"
- Motivational text: "Your response can make a real difference"

FOOTER: Privacy Policy, Contact, Copyright
```

**Tone**: Urgent-but-calm, action-oriented, community-focused

**Special Requirements:**
- Urgency must be communicated via text + color (not color alone)
- Critical: Red accent with icon 🚨
- Urgent: Orange accent with icon ⚠️
- Normal: Standard sage/terracotta colors

---

### Option 3: Moderation Alert (Admin)

**Sent when**: Content is flagged for moderation

**Key Elements:**
- Severity-based visual styling (high/medium/low)
- Report details in scannable format
- Flagged content preview
- Clear admin action CTA

**Content Structure:**
```
HEADER: CARE Collective branding

BODY:
- Alert heading with severity icon
- Severity indicator (HIGH/MEDIUM/LOW)
- Report details box:
  - Report ID
  - Message ID
  - Violation Type
  - Severity
  - Reported By
  - Message Sender
- Flagged content preview (quoted/highlighted)
- PRIMARY BUTTON: "Review Report & Take Action"
- Action required notice

FOOTER: Admin system info, Copyright
```

**Tone**: Professional, urgent, informative

**Special Requirements:**
- High severity: Red theme (🚨)
- Medium severity: Yellow/orange theme (⚠️)
- Low severity: Gray theme (ℹ️)
- Severity must be obvious at a glance

---

## Your Design Task

**Please design the [CHOOSE ONE: Approval / Help Request / Moderation Alert] email template with:**

1. **Your creative interpretation** of the brand guidelines
2. **Complete HTML email code** (table-based, inline CSS)
3. **Mobile-responsive** design (max-width: 600px)
4. **WCAG 2.1 AA accessibility** compliance
5. **Visual mockup or description** of the design concept

### Design Freedom:

Feel free to explore:
- Different header styles (full-width colored band, minimal, logo-focused)
- Creative button designs (rounded, pill-shaped, bordered)
- Unique content box layouts (cards, bordered sections, subtle shadows)
- Icon usage (emojis or unicode symbols only - no images)
- Typography hierarchy (bold headings, size variations)
- Whitespace and padding approaches
- Color combination variations within brand palette

### Design Constraints:

Must maintain:
- Brand colors (can adjust usage/proportions)
- Accessibility standards (contrast, font size, touch targets)
- Table-based HTML structure
- Inline CSS only
- Works without images
- Clear visual hierarchy
- Professional, trustworthy appearance
- Warm, community-focused feel

---

## Deliverables

Please provide:

1. **HTML Email Code**: Complete, ready-to-use HTML
2. **Plain Text Version**: Accessible text fallback
3. **Design Rationale**: Brief explanation of your design choices
4. **Accessibility Notes**: How your design meets WCAG 2.1 AA
5. **Testing Recommendations**: What to check in different email clients

---

## Example Style Directions (Choose or Mix):

**Option A: Modern Minimal**
- Clean white space
- Simple colored accents
- Subtle borders and dividers
- Crisp typography hierarchy

**Option B: Warm & Inviting**
- Generous use of cream background
- Rounded corners everywhere
- Friendly emojis
- Soft color combinations

**Option C: Professional Bold**
- Strong color blocks
- High contrast sections
- Clear visual separation
- Confident typography

**Option D: Community Organic**
- Natural, hand-crafted feel
- Earthy color emphasis (sage, tan, brown)
- Casual, approachable layout
- Personal touches

---

## Success Criteria

Your design succeeds if:
- ✅ Looks professional and trustworthy
- ✅ Feels warm and community-focused
- ✅ Works perfectly on mobile devices
- ✅ Meets all accessibility standards
- ✅ Renders correctly across email clients
- ✅ Clear visual hierarchy guides the eye
- ✅ Primary action is immediately obvious
- ✅ On-brand while bringing fresh perspective

---

## Additional Context

**Current Implementation**: We have a functional version using nested tables, brand colors, and basic component structure. We're looking for **creative exploration** of different visual approaches while maintaining technical requirements.

**Platform Users**: Range from tech-savvy young adults to seniors who may not be familiar with apps. Some users are in crisis situations and need clarity above all else.

**Email Frequency**: Users receive these occasionally, not daily, so each email is important and should feel special.

---

**Ready to design? Choose one template (Approval, Help Request, or Moderation Alert) and show me your creative interpretation!**
