# Gemini Prompt: Improve Existing CARE Collective Email Templates

Use this prompt in Google IDX where Gemini has access to the codebase.

---

## 🚀 OPTIMIZED PROMPT FOR GOOGLE IDX:

Copy and paste this into Gemini in Google IDX:

```
Analyze the email template files in this codebase and provide 5 specific visual design improvements.

FILES TO ANALYZE:
- lib/email/components.ts
- lib/email/templates.ts
- lib/email/utils.ts

PROJECT: CARE Collective - mutual aid platform in Southwest Missouri

BRAND GUIDELINES:
Colors (WCAG 2.1 AA verified):
- Sage #7A9E99 (primary actions)
- Dusty Rose #D8A8A0 (accents, dividers)
- Terracotta #BC6547 (primary CTA buttons)
- Navy #324158 (headings)
- Tan #C39778 (borders, badges)
- Cream #FBF2E9 (backgrounds, info boxes)
- Brown #483129 (body text)

Typography:
- Font: Overlock (fallback: Arial, Helvetica, sans-serif)
- Body: 16px, line-height 1.6
- Headings: 22-28px, bold
- Footer: 12-14px

MUST MAINTAIN:
- Table-based HTML layout (email client compatibility)
- Inline CSS only
- Max width 600px
- WCAG 2.1 AA accessibility
- Mobile-responsive
- 44px minimum touch targets
- Works without images

CURRENT COMPONENTS:

1. emailHeader() - Sage background, white "CARE Collective" text
2. emailFooter() - Dusty rose divider, links, copyright
3. primaryButton() - Terracotta background, white text, nested table structure
4. secondaryButton() - Sage background, white text
5. infoBox() - Cream background, navy headings
6. successBox() - Sage background, white text, centered
7. warningBox() - Yellow background, orange border
8. alertBox() - Severity-based (high/medium/low with color coding)

CURRENT TEMPLATE STRUCTURES:

Help Request Template:
- Header
- Greeting section
- Urgency indicator (if urgent/critical)
- Info box with request details and category badge
- Primary CTA button
- Motivational message
- Footer

Approval Template:
- Header
- Congratulations section
- Success box with confirmation CTA
- "What Happens Next" info box with bullet list
- Link fallback
- Footer

Moderation Alert Template:
- Header
- Alert heading
- Alert box with report details table
- Info box with message preview
- Primary CTA button
- Action required notice
- Footer

YOUR TASK:

Analyze this design and provide specific improvements for:

1. VISUAL HIERARCHY
   - How can we better guide the user's eye?
   - Should headings be larger/smaller?
   - Better use of whitespace?
   - Color blocking improvements?

2. COLOR USAGE
   - Are we using our brand colors effectively?
   - Should we use more/less of certain colors?
   - Better contrast or visual interest?
   - Creative color combinations within our palette?

3. LAYOUT & SPACING
   - Better padding/margin proportions?
   - Section separation improvements?
   - Content box styling enhancements?
   - Mobile optimization tweaks?

4. TYPOGRAPHY
   - Font size hierarchy improvements?
   - Better line-height or letter-spacing?
   - Text alignment variations?
   - Emphasis techniques (bold, color, size)?

5. BUTTON DESIGN
   - More modern button styles?
   - Better hover states (for web-based clients)?
   - Size and padding improvements?
   - Shape variations (rounded, pill, etc.)?

6. COMPONENT ENHANCEMENTS
   - Info box visual improvements?
   - Success box more celebratory?
   - Alert box more attention-grabbing?
   - Header more distinctive?
   - Footer more polished?

7. OVERALL AESTHETIC
   - More modern vs. classic?
   - More playful vs. professional?
   - Warmer vs. cleaner?
   - Unique design elements to make it memorable?

PROVIDE:

For each improvement suggestion:
1. What to change and why
2. Updated HTML/CSS code snippet
3. Visual description of the improvement
4. Accessibility check (does it maintain WCAG 2.1 AA?)
5. Email client compatibility notes

Focus on:
- Quick wins (small changes, big impact)
- Visual polish and refinement
- Making it feel more premium/professional
- Maintaining warm, community-focused feel
- Standing out in a crowded inbox

CONSTRAINTS:
- Must work in Outlook, Gmail, Apple Mail
- No JavaScript
- No external resources (images, fonts must have fallbacks)
- Keep all current functionality
- Maintain accessibility standards

Show me 5 concrete improvements with:
1. Specific file and line references
2. Complete updated code snippets
3. Visual description of the change
4. Accessibility verification
5. Email client compatibility notes

Format each improvement as:
IMPROVEMENT #X: [Title]
FILE: [path:line]
WHY: [Explanation]
CODE: [Updated snippet]
VISUAL: [Description]
ACCESSIBILITY: [✓ or concerns]
COMPATIBILITY: [Gmail/Outlook/Apple Mail notes]
```

---

## How to Use in Google IDX:

### Step 1: Open Gemini
1. Click the **Gemini icon** in the IDX sidebar
2. Start a new chat

### Step 2: Paste the Prompt
Just paste the prompt above - Gemini already has access to all files!

### Step 3: Iterate
Use these follow-up prompts to refine:

---

## Specific Improvement Questions for Gemini:

Copy these follow-up prompts to dig deeper:

### Visual Hierarchy:
```
"How can I make the primary CTA button more prominent without making it overwhelming? Show me 3 variations."
```

### Color Usage:
```
"Our brand colors are Sage, Terracotta, Navy, Cream, Brown, Dusty Rose. Which color should dominate for a welcoming feel? Show examples."
```

### Modern Polish:
```
"Make our email header more visually interesting while keeping it professional. Show 3 modern header designs using our brand colors."
```

### Button Design:
```
"Our current buttons are simple rectangles with rounded corners. Show me 5 more modern button styles that work in email clients."
```

### Info Boxes:
```
"Our info boxes are plain cream backgrounds. How can I make them more visually appealing? Show 3 card-style variations."
```

### Spacing & Layout:
```
"Analyze the spacing in our templates. Where can we add/remove whitespace for better visual flow?"
```

### Typography:
```
"Our headings are 22-28px Navy. How can I make the typography hierarchy more distinctive? Show examples with different sizes and weights."
```

---

## Sample Gemini Response Format:

```
IMPROVEMENT #1: Enhanced Primary Button with Subtle Shadow

WHY: Adds depth and makes the CTA more clickable-looking while maintaining accessibility.

CODE:
<td align="center" style="background-color: #BC6547; border-radius: 8px; box-shadow: 0 2px 4px rgba(188, 101, 71, 0.3);">
  <a href="..." style="display: inline-block; background-color: #BC6547; color: #FFFFFF; padding: 16px 40px; ...">{text}</a>
</td>

VISUAL: Terracotta button with subtle shadow beneath, slightly larger padding
ACCESSIBILITY: ✓ Contrast maintained, shadow is decorative only
COMPATIBILITY: ✓ Works in Gmail, Outlook (shadow may not render but button still functional)

---

IMPROVEMENT #2: Two-Tone Header with Gradient Effect

[etc...]
```

---

## Tips for Best Results:

1. **Be specific**: "Make the header bolder" vs "Change the header"
2. **Reference examples**: "Like modern SaaS emails" or "Similar to Stripe's style"
3. **Iterate quickly**: Start with small changes, build on what works
4. **Test in context**: Ask Gemini to show full template with changes
5. **Maintain constraints**: Remind Gemini about email HTML limitations

---

## Next Steps After Getting Suggestions:

1. **Review** Gemini's suggestions
2. **Test accessibility** using WebAIM contrast checker
3. **Implement** the best improvements in our components
4. **Test** by sending to your email
5. **Iterate** based on how it looks in real email clients

---

---

## ⚡ SUPER QUICK VERSION (30 Seconds)

Just paste this into Gemini in Google IDX:

```
Analyze lib/email/components.ts and lib/email/templates.ts

CARE Collective email templates. Brand: Sage #7A9E99, Terracotta #BC6547, Navy #324158, Cream #FBF2E9

Give me 5 visual improvements:
1. Better button design
2. Improved spacing
3. Modern polish
4. Color usage
5. Visual hierarchy

Requirements: Table-based HTML, inline CSS, WCAG AA, 600px max, works in Gmail/Outlook

Show code snippets with file:line references.
```

**Ready to improve! Paste into Gemini in Google IDX.** 🚀
