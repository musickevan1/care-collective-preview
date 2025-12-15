# Phase 3: Individual Page Updates

**Commit Message**: `feat: Update individual pages per client feedback`

---

## Overview

This phase implements changes to individual pages:
1. Join Page - Form field requirements and text
2. Login Page - Verify CARE capitalization
3. About Page - Structure changes
4. Community Resources Page - Crisis lines integration
5. Help & Support Page - Major simplification
6. Terms of Service Page - Standards alignment
7. Privacy Policy Page - Contact info update

---

## 3.1 Join Page (`/app/signup/page.tsx`)

### Client Request
> Capitalize CARE in the "Join Care Collective" line.
> Make the font of the next sentence a little bigger.
> Let's make location not optional.
> Let's make the "Why do you want to join Care Collective?" box not optional. Also, can you capitalize CARE in that question? Inside the box, can we say, "Tell us briefly why you'd like to join our community," and the sentence below the box to, "This helps us understand what brings you here."

### Changes Required

#### 1. Verify "CARE" capitalization in heading
```tsx
// Current (should already be correct):
<h1>Join CARE Collective</h1>

// Verify this is uppercase "CARE"
```

#### 2. Increase intro sentence font size
```tsx
// Current:
<p className="text-sm text-secondary/80">
  Create your account to start helping your community
</p>

// Updated (larger font):
<p className="text-base md:text-lg text-secondary/80">
  Create your account to start helping your community
</p>
```

#### 3. Make Location field REQUIRED

```tsx
// Current:
<div className="space-y-2">
  <Label htmlFor="location">
    Location <span className="text-secondary/60">(optional)</span>
  </Label>
  <Input
    id="location"
    name="location"
    placeholder="e.g., Springfield, MO"
  />
  <p className="text-xs text-secondary/60">
    Helps connect you with nearby community members
  </p>
</div>

// Updated:
<div className="space-y-2">
  <Label htmlFor="location">
    Location <span className="text-primary">*</span>
  </Label>
  <Input
    id="location"
    name="location"
    placeholder="e.g., Springfield, MO"
    required
  />
  <p className="text-xs text-secondary/60">
    Helps connect you with nearby community members
  </p>
</div>
```

#### 4. Make "Why join" field REQUIRED + update text

```tsx
// Current:
<div className="space-y-2">
  <Label htmlFor="reason">
    Why do you want to join Care Collective?{' '}
    <span className="text-secondary/60">(optional)</span>
  </Label>
  <Textarea
    id="reason"
    name="reason"
    rows={3}
    placeholder="Tell us about yourself..."
  />
  <p className="text-xs text-secondary/60">
    This helps us understand your interest in community mutual support
  </p>
</div>

// Updated:
<div className="space-y-2">
  <Label htmlFor="reason">
    Why do you want to join CARE Collective?{' '}
    <span className="text-primary">*</span>
  </Label>
  <Textarea
    id="reason"
    name="reason"
    rows={3}
    placeholder="Tell us briefly why you'd like to join our community"
    required
  />
  <p className="text-xs text-secondary/60">
    This helps us understand what brings you here.
  </p>
</div>
```

### Form Validation Update
Update the form validation schema to make these fields required:
```typescript
// In form validation
const signupSchema = z.object({
  // ... existing fields
  location: z.string().min(1, "Location is required"),
  reason: z.string().min(10, "Please tell us why you'd like to join"),
});
```

---

## 3.2 Member Login Page (`/app/login/page.tsx`)

### Client Request
> Capitalize CARE here where it says "Sign in to your Care Collective account"

### Verification Required

```tsx
// Current (verify):
<p className="text-secondary/80">
  Sign in to your CARE Collective account
</p>

// Should already be "CARE" - verify and fix if needed
```

**Note**: Exploration found this uses "CARE Collective" but should be verified during implementation.

---

## 3.3 About Page (`/app/about/page.tsx`)

### Client Request
> Remove Tagline under About CARE Collective
> Remove that first box since we included that on the landing page.
> First box under page title will be Our Mission, rest of the page looks amazing!

### Changes Required

#### 1. Remove Tagline
```tsx
// Current structure:
<h1>About CARE Collective</h1>
<p className="tagline">Some tagline text...</p>  {/* REMOVE */}
<div className="first-box">...</div>

// Updated:
<h1>About CARE Collective</h1>
{/* Tagline removed */}
<div className="mission-box">...</div>  {/* Mission is now first */}
```

#### 2. Remove first intro box (content moved to landing page)
The intro text about CARE Collective is now in the "Who We Are" section on the landing page. Remove the redundant box here.

#### 3. Reorder so "Our Mission" is first
```tsx
// Updated order:
1. Our Mission (first box)
2. Our Vision
3. Core Values (4 cards)
4. Community Standards
5. Academic Partnership
```

---

## 3.4 Community Resources Page (`/app/resources/page.tsx`)

### Client Request
> In the "Need Immediate Support?" section, could you change the subheading to: "If you're experiencing a crisis or need mental health support, resources are available 24/7."
> Let's add four crisis lines and remove the link to the extra page.

### Changes Required

#### 1. Update "Need Immediate Support?" section

```tsx
// Current:
<section className="...">
  <h2>Need Immediate Support?</h2>
  <p>If you're in crisis, help is available</p>
  <Link href="/crisis-resources">View Crisis Resources</Link>
</section>

// Updated:
<section className="bg-dusty-rose/10 rounded-lg p-6">
  <h2 className="text-xl font-bold text-secondary mb-2">
    Need Immediate Support?
  </h2>
  <p className="text-secondary/80 mb-4">
    If you're experiencing a crisis or need mental health support, resources
    are available 24/7.
  </p>

  {/* Crisis Lines - Direct listing */}
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <Phone className="w-5 h-5 text-primary" />
      <div>
        <p className="font-semibold">988 Suicide & Crisis Lifeline</p>
        <p className="text-secondary/70">Call or text 988</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <MessageSquare className="w-5 h-5 text-primary" />
      <div>
        <p className="font-semibold">Crisis Text Line</p>
        <p className="text-secondary/70">Text HOME to 741741</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Phone className="w-5 h-5 text-primary" />
      <div>
        <p className="font-semibold">Missouri Crisis Line</p>
        <p className="text-secondary/70">1-888-279-8369</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Shield className="w-5 h-5 text-primary" />
      <div>
        <p className="font-semibold">Veterans Crisis Line</p>
        <p className="text-secondary/70">Call 1-800-273-8255 or text 838255</p>
      </div>
    </div>
  </div>

  {/* Remove link to /crisis-resources */}
</section>
```

#### 2. Remove link to crisis-resources page
Delete any `<Link href="/crisis-resources">` elements from this page.

---

## 3.5 Help & Support Page (`/app/help/page.tsx`)

### Client Request
> Let's change the title of the page to Platform Help & Support
> Let's change line 2 to "We're here to help you connect with your community safely and effectively."
> I think we should remove the top three boxes (Browse Help Requests, Request Help, and Messages) and keep this page as more of a troubleshooting/tech help type of page.
> I think we should remove Phone Support for now!
> Let's remove the Need Immediate Support box since we aren't going to have that page anymore.

### Changes Required

#### 1. Update page title
```tsx
// Current:
<h1>Help & Support</h1>

// Updated:
<h1>Platform Help & Support</h1>

// Also update metadata:
export const metadata = {
  title: 'Platform Help & Support - CARE Collective',
  // ...
};
```

#### 2. Update intro text
```tsx
// Current:
<p>We're here to help you connect with your community and provide
mutual support safely and effectively.</p>

// Updated:
<p>We're here to help you connect with your community safely and effectively.</p>
```

#### 3. Remove Quick Actions section (3 boxes)
Delete the entire section containing:
- Browse Help Requests
- Request Help
- Messages

#### 4. Remove Phone Support section
Delete the phone support contact section entirely.

#### 5. Remove "Need Immediate Support?" section
Delete the crisis resources link/box.

#### Resulting Structure
```tsx
{/* Platform Help & Support */}
<h1>Platform Help & Support</h1>
<p>We're here to help you connect with your community safely and effectively.</p>

{/* Keep: Help Categories */}
<section>
  <h2>Platform Help</h2>
  {/* Getting Started */}
  {/* Messaging System */}
</section>

<section>
  <h2>Safety & Guidelines</h2>
  {/* Community Guidelines */}
  {/* Safety Tips */}
</section>

{/* Keep: Email Support (remove phone) */}
<section>
  <h2>Contact Support</h2>
  <p>Email: swmocarecollective@gmail.com</p>
</section>

{/* Removed: Quick Actions, Phone Support, Crisis Resources */}
```

---

## 3.6 Terms of Service Page (`/app/terms/page.tsx`)

### Client Request
> Community Standards: Can you make these match the standards on the About page and then remove the last sentence that says "For complete Community Standards…"?
> Intellectual Property: Is it really owned by MSU? I'm genuinely unsure of this. I think a statement like this needs to be there, but I wonder who the owner is!
> Background check information: We can use MACHS for $15 per person or Sterling Volunteers for $19 per person which seems like a better deal.

### Changes Required

#### 1. Align Community Standards with About page
Copy the exact Community Standards from `/app/about/page.tsx` to ensure consistency.

```tsx
// Remove the sentence:
"For complete Community Standards, please visit our Community Standards page."

// Replace with the actual standards from the About page
```

#### 2. Update Intellectual Property ownership

```tsx
// Current:
<p>
  All content, trademarks, and intellectual property on this platform are
  owned by Missouri State University...
</p>

// Updated:
<p>
  All content, trademarks, and intellectual property on this platform are
  owned by CARE Collective. The platform is developed in partnership with
  Missouri State University. Unauthorized use, reproduction, or distribution
  of any materials is prohibited.
</p>
```

#### 3. Background check information
**Decision**: Skip for now per user decision. Do not add background check info in this phase.

---

## 3.7 Privacy Policy Page (`/app/privacy-policy/page.tsx`)

### Client Request
> For the Questions and Concerns section, can you make the contact information be the same as that of the Terms of Service page (without the email address)?

### Changes Required

```tsx
// Current:
<section>
  <h2>Questions and Concerns</h2>
  <p>Contact us at: swmocarecollective@gmail.com</p>
  <p>Privacy Officer: Dr. Maureen Templeman</p>
</section>

// Updated (match Terms, remove email):
<section>
  <h2>Questions and Concerns</h2>
  <p>
    If you have questions about this Privacy Policy, please contact the
    CARE Collective administrator.
  </p>
  <p>Privacy Officer: Dr. Maureen Templeman</p>
  {/* Email removed to match Terms format */}
</section>
```

---

## Files Modified in This Phase

| File | Type of Change |
|------|----------------|
| `/app/signup/page.tsx` | Required fields, text updates |
| `/app/login/page.tsx` | Verify CARE caps |
| `/app/about/page.tsx` | Remove tagline, remove intro box, reorder |
| `/app/resources/page.tsx` | Crisis lines direct, remove link |
| `/app/help/page.tsx` | Major simplification |
| `/app/terms/page.tsx` | Standards alignment, IP update |
| `/app/privacy-policy/page.tsx` | Contact info |

**Total Files**: 7
**Estimated Edits**: ~40

---

## Verification Checklist

### Join Page
- [ ] "CARE" capitalized in heading
- [ ] Intro sentence font increased
- [ ] Location field is required
- [ ] "Why join" field is required
- [ ] "CARE" capitalized in question
- [ ] Placeholder updated to "Tell us briefly why you'd like to join our community"
- [ ] Helper text updated to "This helps us understand what brings you here."

### Login Page
- [ ] "CARE" capitalized in subheading

### About Page
- [ ] Tagline removed
- [ ] First intro box removed
- [ ] Our Mission is first section

### Community Resources
- [ ] Subheading updated
- [ ] 4 crisis lines added directly
- [ ] Link to crisis-resources removed

### Help & Support
- [ ] Title changed to "Platform Help & Support"
- [ ] Intro text updated
- [ ] Quick Actions section removed
- [ ] Phone Support removed
- [ ] Crisis resources box removed

### Terms of Service
- [ ] Community Standards match About page
- [ ] "For complete Community Standards..." sentence removed
- [ ] IP ownership changed to "CARE Collective"

### Privacy Policy
- [ ] Contact section matches Terms (no email)
