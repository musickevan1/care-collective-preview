# Home Page Redesign Prompt for Gemini 2.0 Pro

## Project Context

You are designing a home page for **CARE Collective**, a mutual aid platform connecting family caregivers in Southwest Missouri. The platform helps caregivers exchange practical support like groceries, transportation, household help, and companionship.

**Mission**: Connect caregivers who understand each other's challenges and can offer mutual support.

**Target Audience**: Family caregivers (often 40-70 years old) caring for aging loved ones in rural Missouri. Many have limited technical expertise and may be accessing the site during stressful times.

---

## Reference Files (READ THESE FIRST)

You have access to the entire project. Please review these files for full context:

### Client Source Documents
- **`docs/client/documents/home-page-content.docx`** - Content changes, font size specifications, section structure from client
- **`docs/client/documents/email-12172025.txt`** - Design direction email from Dr. Maureen Templeman (founder)
- **`docs/client/documents/maureen-portrait.png`** - Founder photo for About section

### Planning Documentation
- **`docs/development/home-page-redesign-dec2025/client-feedback-summary.md`** - Summary of all client requests
- **`docs/development/home-page-redesign-dec2025/implementation-plan.md`** - Detailed phase-by-phase plan
- **`docs/development/home-page-redesign-dec2025/color-palette-reference.md`** - Color scheme details
- **`docs/development/home-page-redesign-dec2025/section-layouts.md`** - Before/after layout diagrams

### Current Implementation (for reference)
- **`app/page.tsx`** - Current home page component
- **`components/Hero.tsx`** - Current hero section
- **`components/LandingSection.tsx`** - Reusable section wrapper component
- **`app/styles/tokens.css`** - Design tokens (colors, fonts, spacing)
- **`tailwind.config.ts`** - Tailwind color configuration
- **`CLAUDE.md`** - Project guidelines and conventions

### Assets
- **`public/logo-textless.png`** - CARE Collective logo
- **`public/images/maureen-portrait.png`** - Founder photo (copy from docs/client/documents/)

---

## Client Requirements (Dr. Maureen Templeman, Founder)

### Design Inspiration
Reference site: **[Kinderground.org](https://kinderground.org/)**
- Clean, modern aesthetic
- Color-blocked sections with visual variety
- Warm, approachable feel
- Clear visual hierarchy

### Color Palette (MANDATORY - from logo)
Use these exact colors for backgrounds and text:
- **Cream** `#FBF2E9` - Primary background
- **Tan** `#C39778` - Section backgrounds
- **Terracotta** `#BC6547` - Accent sections, warmth
- **Brown** `#483129` - Dark sections, text color

For buttons and interactive accents (HOME PAGE ONLY):
- **Teal** `#3D4F52` - Primary buttons
- **Rose/Dusty Rose** `#D8A8A0` - Secondary accents

### Typography
- Font: **Overlock** (already configured)
- Increase all font sizes for accessibility (older audience)
- Hero title: 72-108px range
- Section titles: 36-60px range
- Body text: 17-22px range

---

## Required Content Structure

### 1. Hero Section
- Logo prominently displayed
- Headline: "Southwest Missouri CARE Collective"
- Subtitle: "Caregiver Assistance and Resource Exchange"
- Brief description (1-2 sentences about mutual support for caregivers)
- **Single CTA button**: "Join Our Community" (teal color)
- **DELETE**: Any secondary "Learn More" or "How It Works" button

### 2. "What is CARE Collective?" Section
Create a **3-box horizontal layout** containing:

**Box 1: "How It Works"**
1. Create an Account
2. Request or Offer Help
3. Build Community

**Box 2: "Why Join?"**
- Header question: "Are you caring for an aging loved one?"
- Bullet points:
  - Mutual exchange - Give what you can, receive what you need
  - Flexibility - Engage when and how you can
  - Learning opportunities - Workshops on topics chosen by members
  - No pressure - Okay to be in a season where you mostly need support

**Box 3: "Kinds of Help"**
- Health & Caregiving
- Groceries & Meals
- Transportation & Errands
- Household & Yard
- Technology & Administrative
- Social & Companionship

### 3. About Section
- **Asymmetrical layout**: Text on left (60%), photo on right (40%)
- Include founder's photo with caption: "Dr. Maureen Templeman, Founder"
- Content about CARE Collective being a network of family caregivers who support each other
- **DELETE**: Any "Academic Partnership" card (move funding info to footer)

### 4. What's Happening Section
- Display upcoming events and community updates
- Dynamic content area (will be populated from CMS)

### 5. Community Resources Section
- 4 category cards: Essentials, Well-Being, Community, Learning
- Brief descriptions for each

### 6. Get in Touch Section
- Email contact prominently displayed: swmocarecollective@gmail.com
- Clean, simple design

### 7. Footer
- **Column 1**: CARE Collective branding + funding statement:
  > "Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University."
- **Facebook icon** linking to: https://www.facebook.com/profile.php?id=61582852599484
- Contact info, quick links, legal links

---

## Color Blocking Pattern

Apply distinct background colors to create visual rhythm:

| Section | Background | Text Color |
|---------|------------|------------|
| Hero | Gradient cream → subtle teal tint | Brown |
| What is CARE Collective? | Cream `#FBF2E9` | Brown |
| About | Tan `#C39778` | Brown |
| What's Happening | Brown `#483129` | White |
| Resources | Cream `#FBF2E9` | Brown |
| Get in Touch | Terracotta `#BC6547` | White |
| Footer | Navy `#324158` | White |

---

## Technical Constraints

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS 4
- **Components**: Must be valid React/TypeScript (use `ReactElement` return type, not `JSX.Element`)
- **Accessibility**: WCAG 2.1 AA compliance required
  - Minimum 44px touch targets
  - Proper color contrast ratios
  - Semantic HTML
  - ARIA labels where needed
- **Mobile-first**: Design must work beautifully on mobile devices

---

## Design Principles to Follow

1. **Warmth over corporate** - This is a community, not a business
2. **Simplicity** - Users may be stressed or unfamiliar with technology
3. **Visual hierarchy** - Clear path through the content
4. **Breathing room** - Generous whitespace, don't crowd elements
5. **Asymmetry for interest** - Avoid perfectly centered everything
6. **Accessibility first** - Large text, high contrast, clear buttons

---

## What NOT to Do

- Don't make it look like a generic SaaS landing page
- Don't use tiny text or low-contrast colors
- Don't create complex multi-step interactions
- Don't use stock photo aesthetics - keep it warm and personal
- Don't overload with animations or visual noise
- Don't use blue as a primary color (reserved for links only)

---

## Git Workflow

Create a new branch for this implementation:
```bash
git checkout main
git checkout -b feature/home-page-redesign-gemini-dec2025
```

Commit changes after each major section is complete. When finished, push and create a PR for review.

---

## Deliverable

Please provide:

1. **Complete JSX/TSX code** for the home page component
2. **Any new Tailwind classes** or CSS custom properties needed
3. **Explanation of design choices** and how they address client requirements

Focus on creating a design that feels welcoming to stressed caregivers while clearly communicating the value of joining the community.
