# Sprint E: Final Polish & UX Fixes - Session Prompt

Copy and paste this prompt to start a new Claude Code session:

---

## Prompt

```
I'm working on Care Collective (mutual aid platform). We're in Phase 3: Production Readiness.

Start Sprint E: Final Polish & UX Fixes. The sprint is in vulcan-todo with ID: 044e4491-2bce-481a-9a99-9e77ae4b72dd

First, activate the sprint using mcp__vulcan-todo__start_sprint, then work through the 11 tasks:

### Mobile & Navigation (4 tasks)

1. **Ensure mobile sign-in redirects to dashboard** (HIGH)
   - Verify approved users on mobile go to /dashboard after sign-in
   - Files: app/login/page.tsx, app/auth/callback/route.ts

2. **Update admin mobile navbar to match normal user + admin panel** (HIGH)
   - Admin pages have custom header different from dashboard
   - Make admin use same header as dashboard with added Admin Panel link
   - Files: app/admin/page.tsx, components/MobileNav.tsx

3. **Add settings link to navigation** (HIGH)
   - Currently only accessible via direct URL /settings
   - Add to profile dropdown or mobile nav
   - Files: components/MobileNav.tsx, components/layout/PlatformLayout.tsx

4. **Comprehensive mobile responsiveness audit** (HIGH)
   - Test all pages: dashboard, requests, messages, admin, settings, profile
   - Document and fix any layout/touch target issues

### Settings Page Fixes (3 tasks)

5. **Fix settings page header to match dashboard** (HIGH)
   - Current header has "Back to Dashboard" link style
   - Use same header component as dashboard
   - File: app/settings/layout.tsx

6. **Fix privacy settings error** (HIGH)
   - Error: "Failed to load privacy settings"
   - Debug and fix data loading issue
   - Files: app/settings/privacy/page.tsx, components/privacy/PrivacyDashboard.tsx

7. **Fix settings toggles on mobile** (MED)
   - Toggles don't display well on mobile
   - Improve responsive styling
   - File: app/settings/notifications/page.tsx

### Waiver & About Updates (3 tasks)

8. **Integrate waiver checkbox into signup flow** (MED)
   - Add waiver checkbox acknowledgment during signup
   - Create signed_waivers database table
   - Files: app/signup/page.tsx, components/legal/

9. **Add full waiver signature to complete-profile** (MED)
   - Show full waiver with signature before dashboard access
   - Use existing WaiverDocument component
   - File: app/complete-profile/page.tsx

10. **Update about page - waiver info, remove background checks** (MED)
    - Remove Sterling Volunteers / background check mention (lines 183-189)
    - Add information about waiver/liability agreement
    - File: app/about/page.tsx

### Testing

11. **E2E test full notification system** (MED)
    - Test both email AND in-platform notifications
    - Verify triggers for help offers, messages, status changes

Use vulcan-todo to track progress - mark tasks in_progress when starting, completed when done.

Reference the launch plan at: ~/.claude/plans/squishy-munching-church.md
```

---

## Quick Reference

**Sprint ID**: `044e4491-2bce-481a-9a99-9e77ae4b72dd`

**Task IDs**:
| Order | Task | ID | Priority |
|-------|------|-----|----------|
| 1 | Mobile sign-in redirect | `77e30c75-d529-46ad-ae08-5007ad31e56e` | HIGH |
| 2 | Admin navbar | `63745e23-1961-4a81-9073-754a1b1884fd` | HIGH |
| 3 | Settings nav link | `16554890-0b44-4b0b-8df3-11c19230ce5f` | HIGH |
| 4 | Mobile audit | `68e8ef7e-3269-4036-bafe-2f07ed0c050b` | HIGH |
| 5 | Settings header | `ec55bcba-c18c-4950-b33d-cac3f67cc675` | HIGH |
| 6 | Privacy error | `2c5544af-f5e2-497c-a013-c87f18be4680` | HIGH |
| 7 | Settings toggles | `4dc20d2e-77ba-4ae9-a23f-59d75873a9a1` | MED |
| 8 | Waiver signup | `7951036a-caf4-46d3-9ef0-cfc344b133da` | MED |
| 9 | Waiver complete-profile | `4a2cd241-9262-4ae3-956c-951f523e9653` | MED |
| 10 | About page update | `314b7230-c3dc-4841-b162-9bee58a2fc3f` | MED |
| 11 | E2E notifications | `f3942ad2-5f5a-41b2-90cd-575e1088dccd` | MED |

**Key Files**:

*Mobile & Navigation:*
- `app/login/page.tsx` - Sign-in redirect logic
- `app/auth/callback/route.ts` - OAuth callback redirect
- `app/admin/page.tsx` - Admin page header
- `components/MobileNav.tsx` - Mobile navigation component
- `components/layout/PlatformLayout.tsx` - Dashboard layout with nav

*Settings:*
- `app/settings/layout.tsx` - Settings layout/header
- `app/settings/privacy/page.tsx` - Privacy settings page
- `app/settings/notifications/page.tsx` - Notification toggles
- `components/privacy/PrivacyDashboard.tsx` - Privacy data component

*Waiver:*
- `app/signup/page.tsx` - Signup form
- `app/complete-profile/page.tsx` - Profile completion flow
- `app/about/page.tsx` - About page (lines 183-189 for bg checks)
- `components/legal/WaiverDocument.tsx` - Existing waiver component
- `components/legal/TypedSignatureField.tsx` - Signature component

**Database Migration Needed**:
```sql
CREATE TABLE signed_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_version TEXT NOT NULL,
  signed_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  record_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE signed_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waivers"
  ON signed_waivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waivers"
  ON signed_waivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

*Created: 2026-01-11 | Sprint E of Care Collective Launch Plan*
