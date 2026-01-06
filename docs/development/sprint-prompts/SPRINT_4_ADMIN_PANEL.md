# Sprint 4: Admin Panel Enhancement

## Objective
Enhance the admin panel's pending membership requests view to display more useful information about applicants.

## Tasks (1 item)

### Task 1: Add More Member Info to Pending Requests View
**File:** `app/admin/applications/page.tsx`

**Currently Displayed:**
- Name (with avatar initial)
- Email
- Location
- Application reason (quoted)
- Applied date
- Status badge

**Fields to Add (all three):**
1. **Phone number** - Direct contact if needed
2. **Caregiving situation** - Context about their role
3. **Email confirmation status** - Trust indicator

**Implementation:**

Find the pending applications mapping section (around line 100-150) and add these fields:

```tsx
{/* Current fields... */}
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Mail className="w-4 h-4" />
  <span>{app.email}</span>
</div>

{/* ADD: Phone number */}
{app.phone && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Phone className="w-4 h-4" />
    <span>{app.phone}</span>
  </div>
)}

{/* ADD: Caregiving situation */}
{app.caregiving_situation && (
  <div className="mt-2 p-2 bg-sage-light/10 rounded text-sm">
    <p className="text-xs font-medium text-muted-foreground mb-1">Caregiving Situation:</p>
    <p className="text-secondary">{app.caregiving_situation}</p>
  </div>
)}

{/* ADD: Email confirmation status */}
<div className="flex items-center gap-2 text-sm">
  {app.email_confirmed ? (
    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
      <CheckCircle className="w-3 h-3 mr-1" />
      Email Verified
    </Badge>
  ) : (
    <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
      <AlertCircle className="w-3 h-3 mr-1" />
      Email Unverified
    </Badge>
  )}
</div>
```

**Required Imports (add if not present):**
```tsx
import { Phone, CheckCircle, AlertCircle } from 'lucide-react';
```

**Ensure the query includes these fields:**
```tsx
const { data: applications } = await supabase
  .from('profiles')
  .select('id, name, email, location, phone, caregiving_situation, email_confirmed, application_reason, applied_at, verification_status')
  .order('applied_at', { ascending: false });
```

**Vulcan Task ID:** `4efa0b22-168e-4aba-9a6d-ce1cb911790b`

---

## Design Considerations

### Information Hierarchy
Display in this order:
1. **Name + Avatar** (most prominent)
2. **Contact Info** (email, phone)
3. **Location**
4. **Email Verification Status** (badge)
5. **Caregiving Situation** (if provided, in highlighted box)
6. **Application Reason** (existing quoted section)
7. **Applied Date**
8. **Action Buttons**

### Privacy Notes
- Phone numbers should only be visible to admins
- Caregiving situation may contain sensitive info - display appropriately
- Email verification status helps identify legitimate applicants

### Mobile Responsiveness
- Stack all fields vertically on mobile
- Ensure touch targets for action buttons remain 44px+
- Consider collapsible sections for long caregiving situations

---

## Verification Steps

After implementation:

1. **Log in as admin** (use existing admin account or test account)

2. **Navigate to Admin Panel > Applications**
   - URL: /admin/applications

3. **Verify new fields appear:**
   - Phone number (if provided by applicant)
   - Caregiving situation (if provided)
   - Email verification badge (green for verified, yellow for unverified)

4. **Test with different applicant data:**
   - Applicant with all fields filled
   - Applicant with minimal fields
   - Applicant with very long caregiving situation text

5. **Mobile check:**
   - Fields should stack cleanly
   - No horizontal overflow

---

## Commit Message
```
feat(admin): display additional member info in pending applications

- Add phone number display for pending membership requests
- Show caregiving situation context when provided
- Add email verification status badge (verified/unverified)
- Improve information hierarchy for faster admin review

Addresses client feedback for admin panel improvements.
```

---

## Blocked Items (Questions for Client)

These tasks require client clarification before proceeding:

### Hero Image Replacement
**Vulcan Task ID:** `82f35f63-7d12-4ed3-8afa-b3eefdd89525`
**Status:** Waiting for community/peer-focused image from client or stock subscription answer

### Login Destination Preference  
**Vulcan Task ID:** `1d098ca4-3fc5-4d81-bde8-03a8f6e10305`
**Current behavior:** Users redirect to `/dashboard` after login
**Question:** Is this correct, or should they go to home page?

### Stock Image Subscription
**Vulcan Task ID:** `96b6483d-5609-4617-b247-c8ece2e462f8`
**Question:** Do we have access to paid stock images for the hero?

---

## Dependencies
- No dependencies on other sprints
- Can be implemented in parallel with Sprints 1-3
