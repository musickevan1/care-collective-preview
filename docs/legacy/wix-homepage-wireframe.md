# Care Collective Wix Homepage - Wireframe & Structure

## 🎯 Overview
This document outlines the structure, content, and design specifications for the Care Collective Wix homepage that will serve as the public face of the community platform while linking to the full Vercel-hosted member portal.

## 🎨 Design Foundation

### Brand Colors (From Current Platform)
```css
/* Primary Brand Colors */
--sage: #7A9E99;           /* Primary action color */
--sage-light: #A3C4BF;     /* Hover states */
--sage-dark: #5A7D78;      /* Active states */

--dusty-rose: #D8A8A0;     /* Secondary accent */
--dusty-rose-light: #E5C6C1; /* Light backgrounds */
--dusty-rose-dark: #B88B83;  /* Emphasis */

/* Supporting Palette */
--terracotta: #BC6547;     /* Warm primary */
--navy: #324158;           /* Text and headers */
--tan: #C39778;            /* Subtle accents */
--cream: #FBF2E9;          /* Main background */
--brown: #483129;          /* Primary text */
```

### Typography
- **Primary Font**: Overlock (warm, approachable)
- **Fallback**: System fonts (Arial, Helvetica, sans-serif)
- **Hierarchy**: Clear headings for accessibility
- **Size**: Minimum 16px for body text (mobile accessibility)

### Design Principles
- Mobile-first responsive design
- Accessibility (WCAG 2.1 AA compliance)
- Clean, friendly community focus
- Clear navigation and CTAs
- Fast loading static content

## 📱 Page Structure

### 1. Header/Navigation Bar
```
┌─────────────────────────────────────────────────────┐
│ [LOGO] CARE Collective    [Home] [About] [Login] │
└─────────────────────────────────────────────────────┘
```

**Elements:**
- Left: Care Collective logo + name
- Right: Navigation links (Home, About, How It Works, Member Login)
- Background: Navy (#324158) with white text
- Height: 64px desktop, 56px mobile
- Logo: 32px × 32px

### 2. Hero Section
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│        Southwest Missouri CARE Collective          │
│       Building community through mutual aid        │
│                                                     │
│    [Join Our Community] [Learn How It Works]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Headline**: "Southwest Missouri CARE Collective" (H1)
- **Subtitle**: "Building community through mutual aid"
- **Description**: Brief mission statement (2-3 sentences)
- **CTAs**: "Join Our Community" (primary) → Vercel platform
- **Secondary**: "Learn How It Works" → scroll to section
- **Background**: Cream (#FBF2E9) with brown text
- **Padding**: 80px vertical desktop, 60px mobile

### 3. Mission Section
```
┌─────────────────────────────────────────────────────┐
│                   Our Mission                      │
│                                                     │
│  To connect caregivers with one another for the    │
│  exchange of practical help, shared resources,     │
│  and mutual support.                               │
│                                                     │
│  [Community Values Grid/Icons]                     │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Headline**: "Our Mission" (H2)
- **Mission Statement**: Provided by client
- **Values**: 3-4 key community values with simple icons
- **Background**: White with sage accent borders

### 4. How It Works Section
```
┌─────────────────────────────────────────────────────┐
│                 How It Works                        │
│                                                     │
│  [1]           [2]           [3]                   │
│ Join      →  Request/Offer → Connect               │
│Community     Help           with Neighbors          │
│                                                     │
│              [Get Started]                          │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Headline**: "How It Works" (H2)
- **Steps**: 3-step process with icons
  1. "Join the Community" - Simple registration
  2. "Request or Offer Help" - Post needs or browse requests
  3. "Connect with Neighbors" - Build relationships
- **CTA**: "Get Started" → Vercel signup
- **Background**: Light sage (#E8F5F3) background

### 5. What's Happening Section
```
┌─────────────────────────────────────────────────────┐
│              What's Happening                       │
│                                                     │
│  [Upcoming Events]  [Community Updates]            │
│  • Event 1          • Update 1                     │
│  • Event 2          • Update 2                     │
│                                                     │
│         [View All in Member Portal]                 │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Headline**: "What's Happening" (H2)
- **Events**: Upcoming community events (placeholder content)
- **Updates**: Recent community news/announcements
- **CTA**: "View All in Member Portal" → Vercel dashboard
- **Background**: White with dusty rose accents

### 6. About Section
```
┌─────────────────────────────────────────────────────┐
│                    About                            │
│                                                     │
│  The CARE Collective (Caregiver Assistance and     │
│  Resource Exchange) is a community for caregivers  │
│  in Southwest Missouri...                          │
│                                                     │
│  [Academic Attribution Box]                         │
│  Dr. Maureen Templeman, Missouri State University  │
│  Southern Gerontological Society Grant             │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Headline**: "About" (H2)
- **Main Content**: Full about blurb provided by client
- **Attribution**: Academic/grant information in styled box
- **Background**: Cream with sage borders

### 7. Footer
```
┌─────────────────────────────────────────────────────┐
│ Contact: swmocarecollective@gmail.com              │
│ Location: Springfield, 65897                        │
│                                                     │
│ [Member Login] [Join Community] [Contact]          │
│                                                     │
│ © 2025 CARE Collective - Southwest Missouri        │
└─────────────────────────────────────────────────────┘
```

**Content:**
- **Contact**: Email and location info
- **Quick Links**: Member portal, join, contact
- **Copyright**: Simple attribution
- **Background**: Navy with white text

## 🔗 Link Strategy

### External Links (to Vercel Platform):
- **Primary CTA**: "Join Our Community" → `https://[vercel-domain]/signup`
- **Member Login**: "Member Login" → `https://[vercel-domain]/login`
- **Dashboard Access**: "Member Portal" → `https://[vercel-domain]/dashboard`

### Internal Links (within Wix):
- **Navigation**: Smooth scroll to sections
- **How It Works**: Scroll to explanation section
- **About**: Scroll to about section

## 📱 Responsive Design Specifications

### Desktop (1200px+):
- Container: Max-width 1200px, centered
- Grid: 2-3 columns for content sections
- Hero: Full-width with side padding
- Navigation: Horizontal menu

### Tablet (768px - 1199px):
- Container: Full width with 40px padding
- Grid: 2 columns, some single column
- Hero: Reduced padding
- Navigation: Horizontal, possibly condensed

### Mobile (< 768px):
- Container: Full width with 20px padding
- Grid: Single column only
- Hero: Vertical stacking, larger touch targets
- Navigation: Hamburger menu or simplified
- Font sizes: Increased for readability
- Touch targets: Minimum 44px height

## ✨ Interactive Elements

### Animations/Transitions:
- **Smooth scrolling** for navigation links
- **Hover effects** on buttons (color transitions)
- **Fade-in** effects for sections on scroll (optional)
- **Button hover**: Scale 1.02, color darken

### Accessibility Features:
- **Focus indicators** on all interactive elements
- **Alt text** for all images
- **Semantic HTML** structure
- **Color contrast** meeting WCAG AA standards
- **Keyboard navigation** support

## 🎯 Performance Optimization

### Loading Strategy:
- **Critical CSS** inlined for above-the-fold content
- **Font loading** optimized (font-display: swap)
- **Images** optimized and properly sized
- **Minimal JavaScript** for static content

### SEO Optimization:
- **Meta titles** and descriptions
- **Structured data** for local business
- **Open Graph** tags for social sharing
- **Local SEO** for Southwest Missouri

## 📝 Content Specifications

### Tone & Voice:
- **Warm and welcoming** - community-focused
- **Clear and simple** - accessible language
- **Empowering** - focus on neighbor helping neighbor
- **Inclusive** - welcoming to all community members

### Key Messages:
1. **Community-driven** mutual aid platform
2. **Southwest Missouri** focused
3. **Easy to use** and accessible
4. **Safe and trusted** environment
5. **Real connections** between neighbors

## 🚀 Implementation Priorities

### Phase 1 (Essential):
1. Basic homepage structure
2. Core content and navigation
3. Mobile-responsive design
4. Links to member portal

### Phase 2 (Enhanced):
1. Smooth animations and transitions
2. Events/calendar integration
3. Advanced interactive elements
4. Performance optimizations

This wireframe serves as the foundation for the Wix homepage implementation, ensuring consistency with the existing Care Collective platform while providing clear pathways to the full member portal functionality.