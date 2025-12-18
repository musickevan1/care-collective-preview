# Next Session: Add SVG Logo to Email Header

## Context

The CARE Collective email templates have been updated with mobile responsiveness. Currently, the email header uses **text-based branding** ("CARE Collective" as an `<h1>`). This session will convert the logo to SVG and add it to the email header for a more professional, branded appearance.

## Current Header Implementation

**File:** `lib/email/components.ts` - `emailHeader()` function (lines 100-123)

```typescript
export function emailHeader(logoText: string = 'CARE Collective'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background-color: ${BRAND_COLORS.sage}; padding: 24px 20px; text-align: center; border-bottom: 4px solid ${BRAND_COLORS.dustyRose};">
          <h1 style="...">CARE Collective</h1>
          <p style="...">Community Aid & Resource Exchange</p>
        </td>
      </tr>
      <!-- Spacer below header -->
      <tr>
        <td style="padding: 0; height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td>
      </tr>
    </table>
  `
}
```

## Goal

Replace the text "CARE Collective" with an **inline SVG logo** that:
1. Displays the CARE Collective brand mark/logo
2. Works across all major email clients (Gmail, Outlook, Apple Mail)
3. Maintains accessibility (alt text, proper sizing)
4. Scales appropriately on mobile devices

## Technical Considerations

### SVG in Email - What Works

1. **Inline SVG** (Best Support):
   ```html
   <img src="data:image/svg+xml;base64,..." alt="CARE Collective" />
   ```
   - Works in: Gmail, Apple Mail, iOS Mail, Yahoo
   - Doesn't work in: Outlook (desktop)

2. **External SVG as `<img>`**:
   ```html
   <img src="https://example.com/logo.svg" alt="CARE Collective" />
   ```
   - Works in: Most modern clients
   - Some clients block external images by default

3. **Fallback Strategy for Outlook**:
   ```html
   <!--[if mso]>
   <img src="https://example.com/logo.png" alt="CARE Collective" />
   <![endif]-->
   <!--[if !mso]><!-->
   <img src="data:image/svg+xml;base64,..." alt="CARE Collective" />
   <!--<![endif]-->
   ```

### Recommended Approach

Use **inline base64-encoded SVG** with a **PNG fallback for Outlook**:

```typescript
export function emailHeader(): string {
  const svgLogo = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`
  const pngFallback = 'https://swmocarecollective.com/logo-email.png'

  return `
    <table role="presentation" ...>
      <tr>
        <td style="background-color: ${BRAND_COLORS.sage}; padding: 24px 20px; text-align: center; border-bottom: 4px solid ${BRAND_COLORS.dustyRose};">
          <!--[if mso]>
          <img src="${pngFallback}" alt="CARE Collective" width="200" height="50" style="display: block; margin: 0 auto;" />
          <![endif]-->
          <!--[if !mso]><!-->
          <img src="${svgLogo}" alt="CARE Collective" width="200" height="50" style="display: block; margin: 0 auto; max-width: 100%;" />
          <!--<![endif]-->
          <p style="margin: 10px 0 0 0; ...">Community Aid & Resource Exchange</p>
        </td>
      </tr>
    </table>
  `
}
```

## Tasks

### 1. Obtain/Create SVG Logo
- [ ] Check if SVG logo exists in `public/` directory
- [ ] If not, create SVG from existing logo image
- [ ] Optimize SVG (remove unnecessary metadata, minify)
- [ ] Recommended tools: SVGOMG, Inkscape, or Figma export

### 2. Create PNG Fallback
- [ ] Export PNG version at 2x resolution (400x100 for 200x50 display)
- [ ] Host at `public/logo-email.png`
- [ ] Ensure it's accessible via production URL

### 3. Update emailHeader() Component
- [ ] Add base64-encoded SVG logo
- [ ] Add MSO conditional for Outlook PNG fallback
- [ ] Maintain tagline below logo
- [ ] Test responsive sizing

### 4. Test Across Email Clients
- [ ] Gmail (web + mobile)
- [ ] Apple Mail (iOS + macOS)
- [ ] Outlook (desktop + web)
- [ ] Yahoo Mail

## Brand Guidelines

### Colors (from CLAUDE.md)
```typescript
BRAND_COLORS = {
  sage: '#5A7E79',        // Header background
  sageLight: '#A3C4BF',   // Accents
  dustyRose: '#D8A8A0',   // Header border accent
  terracotta: '#BC6547',  // Primary buttons
  navy: '#324158',        // Footer background
  cream: '#FBF2E9',       // Email background
  brown: '#483129',       // Body text
}
```

### Logo Specifications
- **Max Width:** 200px (desktop), 160px (mobile)
- **Background:** Should work on sage (#5A7E79) background
- **Format:** White/light colored logo recommended for contrast
- **Alt Text:** "CARE Collective"

## Files to Modify

1. `lib/email/components.ts` - Update `emailHeader()` function
2. `public/logo-email.svg` - Add optimized SVG logo
3. `public/logo-email.png` - Add PNG fallback for Outlook
4. `scripts/generate-email-previews.ts` - May need update if logo path changes

## Reference: Current Email Templates

All 9 templates use `emailHeader()`:
- `approvalTemplate()`
- `helpRequestTemplate()`
- `moderationAlertTemplate()`
- `waitlistTemplate()`
- `userActivatedTemplate()`
- `rejectionTemplate()`
- `helpOfferTemplate()`
- `userSuspendedTemplate()`
- `bulkOperationSummaryTemplate()`

## Success Criteria

- [ ] SVG logo displays correctly in Gmail, Apple Mail
- [ ] PNG fallback works in Outlook
- [ ] Logo scales appropriately on mobile (max-width: 100%)
- [ ] Maintains 44px+ touch target if clickable
- [ ] Alt text provides accessibility
- [ ] All 9 templates render correctly with new header
- [ ] Preview file updated and working

---

*Created: December 2024*
*Related: Email mobile responsiveness enhancement*
