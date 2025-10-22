# Next Session Prompt: Geographic Filtering & Expiration Reminders

Use this prompt to start the next development session and complete the remaining medium-priority tasks.

---

## Session Prompt

```
Continue Care Collective implementation - complete remaining backend features from previous sessions.

## Status: All High Priority Complete! 🎉

Previous sessions completed:
- ✅ Logo sizes, About/Contact/Resources pages, navigation (Oct 22 AM)
- ✅ Category system refactor (7 categories + 30+ subcategories) (Oct 22 PM)
- ✅ Terms of Service page with version tracking (Oct 22 PM)
- ✅ Signup form with required terms checkbox (Oct 22 PM)
- ✅ Request form with conditional subcategories + ongoing checkbox (Oct 22 PM)
- ✅ Database migration with auto-expiration trigger (Oct 22 PM)

## 🎯 Remaining Tasks (2 Backend Features)

### Task 1: Geographic Filtering (3-4 hours)
Restrict platform to 30-mile radius from Springfield, MO with waitlist for outside users.

**Requirements:**
- Add PostGIS extension for geospatial queries
- Store latitude/longitude with user profiles
- Geocode user location on signup (use location field)
- Calculate distance from Springfield, MO (37.2090° N, 93.2923° W)
- Filter help requests to only show within 30-mile radius
- Show waitlist page for users outside radius
- Admin panel to manually approve geographic exceptions

**Implementation Checklist:**
1. Create migration to add lat/lng fields to profiles table
2. Enable PostGIS extension in Supabase
3. Create geocoding service (lib/geo/geocoding.ts)
   - Use geocoding API (OpenStreetMap Nominatim or similar)
   - Handle Missouri addresses
   - Store coordinates on signup
4. Create distance calculation utility (lib/geo/distance.ts)
   - Haversine formula for distance
   - SPRINGFIELD_CENTER constant (37.2090, -93.2923)
   - RADIUS_MILES constant (30)
5. Update signup flow:
   - Geocode location after profile creation
   - Check if within radius
   - Redirect to waitlist if outside
6. Create geographic waitlist page (app/waitlist-geographic/page.tsx)
   - Explain service area limitation
   - Option to request access
   - Show approximate distance from Springfield
7. Update help request queries:
   - Filter by distance in SQL
   - Only show requests within radius
8. Admin panel additions:
   - View users on geographic waitlist
   - Manually approve exceptions
   - Override distance check

**SQL Example:**
```sql
-- Check if user is within radius
SELECT
  id,
  name,
  ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint(-93.2923, 37.2090)::geography
  ) / 1609.34 AS distance_miles
FROM profiles
WHERE ST_Distance(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint(-93.2923, 37.2090)::geography
) / 1609.34 <= 30;
```

**Files to Create:**
- `lib/geo/geocoding.ts`
- `lib/geo/distance.ts`
- `app/waitlist-geographic/page.tsx`
- `supabase/migrations/[timestamp]_add_geolocation.sql`

**Files to Modify:**
- `app/signup/page.tsx` - Add geocoding after profile creation
- `app/requests/page.tsx` - Filter by distance
- `app/dashboard/page.tsx` - Filter by distance
- `app/admin/page.tsx` - Add geographic exceptions UI
- `lib/database.types.ts` - Regenerate after migration

### Task 2: Expiration Reminder System (4-5 hours)
Email reminders 7 days before expiration + auto-close expired requests.

**Requirements:**
- Send email 7 days before request expires
- Auto-close requests that have expired
- Allow users to extend/mark complete before expiration
- Only apply to non-ongoing requests (is_ongoing = false)
- Email should include link to request detail page

**Implementation Checklist:**
1. Set up email service:
   - Create Resend account (recommended) or use SendGrid
   - Add API key to environment variables
   - Create email service utility (lib/email/send.ts)
2. Create email template (lib/email/templates/expiration-reminder.tsx)
   - React Email for template
   - Include request details
   - Link to request detail page
   - Option to mark complete or extend
3. Create cron job endpoint (app/api/cron/check-expirations/route.ts)
   - Check for requests expiring in 7 days
   - Send reminder emails
   - Check for expired requests (expires_at < now)
   - Auto-close expired requests
4. Set up Vercel Cron (vercel.json)
   - Run daily at 8 AM CST
   - Call /api/cron/check-expirations
5. Add extend request functionality:
   - Button on request detail page
   - Extends by 7 more days
   - Only available to request owner
6. Update request queries:
   - Filter out expired requests from browse page
   - Show "expired" badge on dashboard

**Email Template Example:**
```
Subject: Your CARE Collective request expires in 7 days

Hi [Name],

Your help request "[Request Title]" will expire in 7 days (on [Date]).

If you still need help, you can:
- Mark it as complete if you've received help
- Extend it for 7 more days
- Mark it as ongoing (won't expire)

View your request: [Link]

Thanks,
CARE Collective Team
```

**Cron Configuration (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/check-expirations",
    "schedule": "0 13 * * *"
  }]
}
```

**Files to Create:**
- `lib/email/send.ts`
- `lib/email/templates/expiration-reminder.tsx`
- `app/api/cron/check-expirations/route.ts`
- `vercel.json` (if doesn't exist)

**Files to Modify:**
- `app/requests/[id]/page.tsx` - Add extend button
- `app/requests/page.tsx` - Filter expired requests
- `.env.local` - Add email API key
- `.env.example` - Document email env var

**Environment Variables Needed:**
```
RESEND_API_KEY=re_...
```

## 📚 Reference Files

**Previous Session Summaries:**
- `docs/sessions/session-2025-10-22.md` - Morning session
- `docs/sessions/session-2025-10-22-afternoon.md` - Afternoon session

**Client Requirements:**
- `docs/client/Send_to_Evan_Content.md` - Original requirements
- `docs/client/Resources_Page.md` - Resources content (already done)

**Project Docs:**
- `CLAUDE.md` - Project guidelines and rules
- `PROJECT_STATUS.md` - Overall project status
- Database schema: `lib/database.types.ts`
- Category constants: `lib/constants/categories.ts`

## 🚀 Getting Started

1. Review previous session summaries
2. Choose which task to start with (can do in parallel)
3. Create todo list with subtasks
4. Start implementation
5. Test thoroughly before committing
6. Deploy and verify on production

## ⚠️ Important Notes

- Database migration already has `expires_at` field (ready for Task 2)
- Signup form already collects location (ready for Task 1)
- All high-priority features are complete and deployed
- Both tasks are independent (can implement in any order)
- Test email sending in development before production
- Use service role for cron job (bypasses RLS)

## 🎯 Success Criteria

**Task 1 (Geographic):**
- ✅ Users outside 30-mile radius see waitlist
- ✅ Help requests filtered by distance
- ✅ Admin can approve exceptions
- ✅ Coordinates stored and accurate
- ✅ Distance calculations correct

**Task 2 (Expiration):**
- ✅ Reminder emails sent 7 days before expiration
- ✅ Expired requests auto-closed
- ✅ Users can extend requests
- ✅ Ongoing requests never expire
- ✅ Email templates professional

Current branch: main
Latest commit: c64d783
Deployment: https://care-collective-preview.vercel.app

Ready to continue! 🚀
```

---

## Quick Start Options

### Option 1: Full Implementation
Paste the entire prompt above to implement both features.

### Option 2: Geographic Filtering Only
```
Implement geographic filtering for Care Collective (30-mile radius from Springfield, MO).

Reference: docs/sessions/session-next-prompt.md - Task 1

Requirements:
- Add PostGIS and lat/lng fields
- Geocode user locations on signup
- Filter help requests by distance
- Waitlist page for outside users
- Admin exceptions panel

Current status: All high-priority tasks complete (see docs/sessions/session-2025-10-22-afternoon.md)
```

### Option 3: Expiration Reminders Only
```
Implement expiration reminder system for Care Collective help requests.

Reference: docs/sessions/session-next-prompt.md - Task 2

Requirements:
- 7-day warning emails
- Auto-close expired requests
- Extend request functionality
- Resend/SendGrid integration
- Vercel Cron setup

Current status: All high-priority tasks complete, expires_at field already in database (see docs/sessions/session-2025-10-22-afternoon.md)
```

---

## Estimated Timeline

**Task 1 (Geographic):** 3-4 hours
- Migration + PostGIS: 30 min
- Geocoding service: 1 hour
- Distance calculations: 30 min
- Signup flow updates: 1 hour
- Waitlist page: 30 min
- Admin panel: 30 min
- Testing: 30 min

**Task 2 (Expiration):** 4-5 hours
- Email service setup: 1 hour
- Email templates: 1 hour
- Cron job: 1.5 hours
- Extend functionality: 1 hour
- Testing: 1 hour

**Total:** 7-9 hours (can be done across 2 sessions)

---

## Dependencies

### Task 1 (Geographic)
- PostGIS extension in Supabase ✅ (available)
- Geocoding API (Nominatim is free, no key needed)
- No additional costs

### Task 2 (Expiration)
- Email service account:
  - **Resend** (recommended): 3,000 emails/month free
  - **SendGrid**: 100 emails/day free
- Vercel Cron ✅ (included in Vercel)
- React Email for templates ✅ (already have React)

---

## Notes

- Both tasks are backend-focused
- Both enhance core platform functionality
- Geographic filtering is more urgent (affects all users)
- Expiration reminders improve request lifecycle
- No frontend redesign needed
- Both integrate with existing features
- Test thoroughly before deploying to production
