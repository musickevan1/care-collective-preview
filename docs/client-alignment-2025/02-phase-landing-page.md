# Phase 2: Landing Page Updates

**Commit Message**: `feat: Landing page redesign per client feedback`

---

## Overview

This phase implements all landing page changes requested by the client:
1. Color scheme (cream background, terra cotta dividers, almond boxes)
2. Hero section text updates
3. Why Join section complete rewrite
4. About section restructure
5. Resources intro text update
6. Footer updates
7. Menu evaluation

---

## 2.1 Color Scheme Changes

### Client Request
> "Instead of using a different background color for each additional section, could we make the entire page background (except top and bottom blue sections) the cream color #FBF2E9, and separate each section with soft divider lines in the terra cotta #BC6547?"

### Current State
- Different background colors per section
- Some sections have sage/dusty-rose backgrounds

### Required Changes in `/app/page.tsx`

#### Main Container Background
```tsx
// Current (various):
<section className="bg-sage-light/20 ...">
<section className="bg-dusty-rose/10 ...">

// Updated (all sections):
<section className="bg-background ...">  // #FBF2E9 cream
```

#### Section Dividers
Ensure terra cotta dividers between sections:
```tsx
// Between each major section
<div className="h-px bg-primary w-full" />  // #BC6547 terra cotta
```

### How It Works Box Colors

#### Client Request
> "For the background color of the boxes, can we use #E9DDD4 or another neutral accent color instead of the white?"

```tsx
// Current:
<div className="bg-white rounded-lg shadow-md p-6">

// Updated:
<div className="bg-almond rounded-lg shadow-md p-6">  // #E9DDD4
```

**Note**: This requires the `almond` color added in Phase 1.

---

## 2.2 Hero Section Updates

### File: `/components/Hero.tsx`

### Client Request (Section 1)
> Line 1 (same): Southwest Missouri
> Line 2 (same): CARE Collective
> Line 3 (reworded): Caregiver Assistance and Resource Exchange (same size font as now, maybe first letter of each word bolded to show that it is what CARE stands for)
> Line 4 (reworded): The CARE Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources. (Maybe this font could be just slightly bigger.)

### Current Structure
```tsx
// Line 1: "Southwest Missouri" (location badge)
// Line 2: "CARE Collective" (main heading)
// Line 3: Current tagline
// Line 4: Description paragraph
```

### Updated Content

```tsx
// Line 1: Keep as-is
"Southwest Missouri"

// Line 2: Keep as-is
"CARE Collective"

// Line 3: Updated with bold first letters
<p className="text-lg md:text-xl text-secondary/90 font-medium">
  <span className="font-bold">C</span>aregiver{' '}
  <span className="font-bold">A</span>ssistance and{' '}
  <span className="font-bold">R</span>esource{' '}
  <span className="font-bold">E</span>xchange
</p>

// Line 4: New description with slightly larger font
<p className="text-lg md:text-xl text-secondary/80 leading-relaxed">
  The CARE Collective is a network of family caregivers in Southwest Missouri
  who support each other through practical help and shared resources.
</p>
```

### Font Size Adjustment
- Current description: `text-base md:text-lg`
- Updated description: `text-lg md:text-xl` (slightly larger per client request)

---

## 2.3 Why Join Section - Complete Rewrite

### Client Request (Section 3)
> Let's create a Why Join? section here. Here's the text for it:

### New Content (From Client Document)

```tsx
{/* Why Join Section Header */}
<h2 className="text-3xl md:text-4xl font-bold text-secondary mb-6">
  Why Join?
</h2>

{/* Intro Paragraph */}
<p className="text-lg text-secondary/80 mb-8">
  The CARE Collective connects you with other caregivers who understand what
  you're going through and are ready to help and be helped.
</p>

{/* Benefits Header */}
<h3 className="text-xl font-semibold text-secondary mb-4">
  As a member, you'll have access to:
</h3>

{/* Benefits List - 5 items with descriptions */}
<ul className="space-y-4 mb-8">
  <li>
    <strong>Practical help when you need it</strong> – Get support with respite,
    errands, paperwork, or just someone to check in.
  </li>
  <li>
    <strong>Mutual exchange of support</strong> – Caregivers helping each other
    meet real, practical needs. Give what you can, receive what you need.
    Everyone has something to offer, and everyone needs help sometimes.
  </li>
  <li>
    <strong>Flexibility that works for you</strong> – Participate in ways that
    fit your schedule and capacity, whether that's offering a ride once a month
    or connecting for weekly check-ins.
  </li>
  <li>
    <strong>Learning opportunities</strong> – Attend workshops on topics that
    matter to you, from advance care planning to caregiver self-care.
  </li>
  <li>
    <strong>No pressure, just support</strong> – Feeling overwhelmed? Don't have
    much free time? Worried you don't have much to offer? You belong here, and
    it's okay to be in a season where you mostly need support.
  </li>
</ul>

{/* Closing Paragraph */}
<p className="text-lg text-secondary/80">
  Joining is simple. We'll help you get started, and you can participate in
  whatever ways work for your life right now.
</p>

{/* CTA Button */}
<Link href="/signup" className="btn-sage">
  Join Our Community
</Link>
```

---

## 2.4 About Section Restructure

### Client Request (Section 4)
> Line 2 (stretch Our Story box across the screen, but call it "Who We Are" and change some of the content)
> Remove the Join Our Community box from here since we already have it in a couple other places.
> Make "Learn More About Us" a box so it really stands out since this is where they'll find our Mission, etc.

### Changes Required

#### 1. Rename "Our Story" → "Who We Are" and stretch full width

```tsx
{/* Current: Two-column layout with Our Story */}
<div className="grid md:grid-cols-2 gap-8">
  <div className="bg-white p-6 rounded-lg">
    <h3>Our Story</h3>
    ...
  </div>
  <div className="bg-white p-6 rounded-lg">
    <h3>Academic Partnership</h3>
    ...
  </div>
</div>

{/* Updated: Full-width Who We Are, then Academic Partnership below */}
<div className="space-y-8">
  {/* Who We Are - Full Width */}
  <div className="bg-almond p-8 rounded-lg">
    <h3 className="text-2xl font-bold text-secondary mb-4">Who We Are</h3>
    <p className="text-secondary/80 leading-relaxed">
      The CARE (Caregiver Assistance and Resource Exchange) Collective is a
      network of family caregivers in Southwest Missouri who support each other
      through practical help and shared resources. The Collective is powered by
      caregivers themselves, along with students and volunteers who help maintain
      the site and coordinate outreach and engagement. Together, we are building
      a space where caregivers find connection, practical help, and the mutual
      support that makes caregiving sustainable.
    </p>
  </div>

  {/* Academic Partnership - Keep existing */}
  <div className="bg-white p-6 rounded-lg border-t-4 border-dusty-rose">
    <h3>Academic Partnership</h3>
    ...
  </div>
</div>
```

#### 2. Remove "Join Our Community" box
Delete the redundant CTA box from About section (already in Hero and Why Join).

#### 3. Make "Learn More About Us" a prominent button/box

```tsx
{/* Updated: Prominent box-style button */}
<Link
  href="/about"
  className="block bg-sage text-white p-6 rounded-lg text-center hover:bg-sage-dark transition-colors"
>
  <span className="text-xl font-semibold">Learn More About Us</span>
  <span className="block text-sm mt-2 text-white/80">
    Discover our mission, vision, and community standards
  </span>
</Link>
```

---

## 2.5 Resources Section Text Update

### Client Request (Section 6)
> In terms of text, can you just change the top line to:
> "Connect with trusted local and regional organizations that offer practical support, guidance, and connection."

```tsx
// Current intro text:
"Discover trusted local organizations and services that support caregivers..."

// Updated intro text:
"Connect with trusted local and regional organizations that offer practical
support, guidance, and connection."
```

---

## 2.6 Footer Updates

### Client Request
> Under Contact Information, let's add my name.
> Under Quick Links, I think Member Login and Member Portal are the same thing? Since the top bar says Member Login, I think it makes sense to just use that here.

### Changes Required in `/app/page.tsx`

#### 1. Add Dr. Templeman's name under Contact Information

```tsx
{/* Contact Information section */}
<div>
  <h4 className="font-semibold text-white mb-4">Contact Information</h4>
  <p className="text-white/80">Dr. Maureen Templeman</p>
  <a href="mailto:swmocarecollective@gmail.com" className="text-white/80 hover:text-white">
    swmocarecollective@gmail.com
  </a>
</div>
```

#### 2. Consolidate Member Login/Portal references

```tsx
{/* Quick Links section */}
// Remove "Member Portal" if it exists
// Keep only "Member Login" to match header

<Link href="/login" className="text-white/80 hover:text-white">
  Member Login
</Link>
```

---

## 2.7 Menu Items Evaluation

### Client Request
> Home (maybe this can be removed)
> Contact Us (maybe this can be removed too, if the menu gets too crowded)

### Current Menu Order (Desktop)
1. Home
2. How It Works
3. Why Join?
4. About Us
5. What's Happening
6. Resources
7. Contact Us

### Evaluation
- **Home**: Logo already links to home. Can be removed to declutter.
- **Contact Us**: Contact info is in footer. Can be removed if crowded.

### Recommendation
Remove "Home" - logo serves this purpose. Evaluate "Contact Us" based on final visual appearance.

```tsx
{/* Updated navigation */}
<nav className="hidden lg:flex items-center space-x-6">
  {/* Remove Home link - logo already links home */}
  <a href="#how-it-works">How It Works</a>
  <a href="#why-join">Why Join?</a>
  <a href="#about">About Us</a>
  <a href="#whats-happening">What's Happening</a>
  <a href="#resources">Resources</a>
  <a href="#contact">Contact Us</a>  {/* Evaluate for removal */}
</nav>
```

---

## 2.8 What's Happening Section

### Client Request
> The content of this section is perfect! I also like the colors, but if we are making the background of the entire page the cream color #FBF2E9, the boxes in this section will probably have to be a different color.

### Current State
- Event boxes may have white or matching backgrounds

### Required Change
Update event card backgrounds to distinguish from cream:
```tsx
// Options:
<div className="bg-white ...">       // Keep white for contrast
<div className="bg-almond ...">      // Use almond #E9DDD4
```

**Recommendation**: Keep white backgrounds for event cards - provides good contrast against cream.

---

## Files Modified in This Phase

| File | Type of Change |
|------|----------------|
| `/app/page.tsx` | Background colors, About restructure, Why Join rewrite, Footer, Resources text, Menu |
| `/components/Hero.tsx` | Line 3 & 4 text updates, font sizes |

**Total Files**: 2
**Estimated Edits**: ~30

---

## Visual Reference

### Before/After Section Backgrounds

| Section | Before | After |
|---------|--------|-------|
| How It Works | Various | Cream #FBF2E9 with almond boxes #E9DDD4 |
| Why Join | Various | Cream #FBF2E9 |
| About | Various | Cream #FBF2E9 with almond "Who We Are" |
| What's Happening | Various | Cream #FBF2E9 with white event cards |
| Resources | Various | Cream #FBF2E9 |
| Contact | Various | Cream #FBF2E9 |
| Header | Navy | Navy #324158 (unchanged) |
| Footer | Navy | Navy #324158 (unchanged) |
