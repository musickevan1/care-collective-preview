# Phase 3: Calendar Events & Site Content Management

## 📍 Current Status: Phase 2 Complete ✅

### Phase 2 Accomplishments (Just Deployed)
- ✅ CMS validation schemas created
- ✅ Database types generated for all CMS tables
- ✅ Community Updates Manager fully functional
- ✅ 6 admin API routes with authentication
- ✅ Draft/publish workflow implemented
- ✅ Mobile-responsive, WCAG 2.1 AA compliant UI
- ✅ Integrated into main admin dashboard

**Live at**: `/admin/cms` and `/admin/cms/community-updates`

**Deployment**: Automatic deployment triggered via Git push to main
- Commit: `01354d6` - "feat: Implement Phase 2 CMS Admin UI - Community Updates Management"
- Monitor at: https://vercel.com/musickevan1s-projects/care-collective-preview

---

## 🚀 Next Session: Phase 3 Implementation

```
I'm continuing the CMS admin panel enhancement project. Phase 2 (Community Updates) is complete and deployed.

Please implement Phase 3: Calendar Events and Site Content Management UI.

### Requirements:

**Calendar Events Manager:**
- Calendar dashboard with event list view
- Event creation/editing forms
- Event category management
- Recurring event support (rrule format)
- Publishing workflow (draft → published)
- Event filtering by category and status
- Mobile-responsive with WCAG 2.1 AA compliance

**Site Content Editor:**
- Editors for 3 sections: Mission & Values, About/Story, Events & Updates
- Structured form fields (NOT rich text)
- Draft/publish workflow with preview
- JSON-based content storage
- Side-by-side comparison (draft vs published)

### Context:
- Phase 2 patterns established in:
  - `lib/validations/cms.ts` - Follow validation patterns
  - `components/admin/cms/CommunityUpdatesManager.tsx` - UI component patterns
  - `app/api/admin/cms/community-updates/` - API route patterns
- Database schema ready (migrations applied):
  - `calendar_events` table with categories, recurrence, publishing
  - `event_categories` table (6 categories seeded)
  - `site_content` table with draft/publish workflow
- Admin authentication: Use `requireAdminAuth()` and `getAdminUser()`
- Existing validation schemas in `lib/validations/cms.ts`:
  - `calendarEventSchema`
  - `eventCategorySchema`
  - `siteContentSchema`

### Implementation Plan:

**Step 1: Calendar Events API Routes (1.5 hours)**
Create API routes following community-updates patterns:
- `/api/admin/cms/calendar/events` (GET, POST)
- `/api/admin/cms/calendar/events/[id]` (GET, PATCH, DELETE)
- `/api/admin/cms/calendar/events/[id]/publish` (POST)
- `/api/admin/cms/calendar/categories` (GET, POST, PATCH, DELETE)

**Step 2: Calendar Events UI Components (2 hours)**
- `CalendarEventsManager.tsx` (<200 lines) - Event list with filters
- `EventEditor.tsx` (<200 lines) - Event creation/edit form
- `EventCategoryManager.tsx` (<150 lines) - Category CRUD
- Use existing UI components: Card, Input, Textarea, Select, Badge, Button
- Date inputs: Use standard HTML datetime-local inputs (simple, accessible)

**Step 3: Site Content Editor Components (2 hours)**
- `SiteContentEditor.tsx` (<200 lines) - Section editor with tabs
- `ContentPreview.tsx` (<150 lines) - Preview draft vs published
- Structured fields for each section (no rich text editor needed)
- JSON content structure: `{ heading: string, body: string, items: [] }`

**Step 4: Admin Pages (1 hour)**
- `/admin/cms/calendar` - Calendar events manager page
- `/admin/cms/calendar/categories` - Category management page
- `/admin/cms/site-content` - Site content editor page
- Update CMSDashboard to enable these sections

**Step 5: Testing & Refinement (30 min)**
- Test draft/publish workflow for events
- Test category filtering
- Test site content editing
- Verify mobile responsiveness
- Check accessibility (WCAG 2.1 AA)

### Technical Guidelines:
- **File Limit**: 200 lines max per component
- **Validation**: Use existing schemas from `lib/validations/cms.ts`
- **Error Handling**: Follow community-updates patterns
- **Accessibility**:
  - All buttons: `min-h-[44px]`
  - All inputs: `min-h-[44px]`
  - Proper labels with `htmlFor`
  - Keyboard navigation support
- **Brand Colors**:
  - Primary actions: `variant="sage"`
  - Publish: `variant="terracotta"`
  - Delete: `variant="destructive"`
- **Mobile-First**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### Recurring Events:
For Phase 3, implement **basic recurrence support**:
- Store `recurrence_rule` as string (rrule format)
- Input field for recurrence pattern (text input)
- Display recurrence info in event list
- **Full rrule UI builder**: Defer to Phase 4 or later

### Site Content Structure:
Example JSON for `site_content.content`:
```json
{
  "mission": {
    "heading": "Our Mission",
    "body": "Care Collective connects...",
    "values": ["Community", "Support", "Empowerment"]
  },
  "about": {
    "heading": "Our Story",
    "body": "Founded in 2025...",
    "team": []
  }
}
```

### Success Criteria:
- [ ] Admin can create/edit/publish calendar events
- [ ] Admin can manage event categories
- [ ] Admin can edit site content sections (mission, about)
- [ ] Draft/publish workflow works for all content types
- [ ] Events can be filtered by category and status
- [ ] All forms are mobile-responsive and accessible
- [ ] All files under 200 lines

### Estimated Time: 4-5 hours

Use the Task tool with subagent_type=Plan if you need to research existing patterns before starting.
```

---

## 📋 Phase 3 Checklist

**API Routes (6 routes):**
- [ ] Calendar events: list, create, update, delete, publish
- [ ] Event categories: CRUD operations

**UI Components (6 components):**
- [ ] CalendarEventsManager (event list & filters)
- [ ] EventEditor (create/edit form)
- [ ] EventCategoryManager (category CRUD)
- [ ] SiteContentEditor (section editors)
- [ ] ContentPreview (draft vs published)
- [ ] Update CMSDashboard (enable new sections)

**Admin Pages (3 pages):**
- [ ] /admin/cms/calendar
- [ ] /admin/cms/calendar/categories
- [ ] /admin/cms/site-content

**Features:**
- [ ] Draft/publish workflow for events
- [ ] Category filtering for events
- [ ] Recurring event basic support
- [ ] Site content structured editing
- [ ] Preview before publishing

---

## 🔗 Key File References

**Patterns to Follow:**
- API: `app/api/admin/cms/community-updates/`
- Components: `components/admin/cms/CommunityUpdatesManager.tsx`
- Pages: `app/admin/cms/community-updates/page.tsx`
- Validation: `lib/validations/cms.ts`

**Database Tables (Already Created):**
- `calendar_events` - Events with categories, recurrence, publishing
- `event_categories` - Event types (6 seeded)
- `site_content` - Sections with draft/publish workflow

**Admin Auth:**
- `lib/api/admin-auth.ts` - `requireAdminAuth()`, `getAdminUser()`

**UI Components:**
- `components/ui/` - Card, Input, Textarea, Select, Button, Badge, etc.

---

## 💡 Implementation Notes

**Date/Time Inputs:**
Use native HTML datetime-local inputs - simple, accessible, no library needed:
```tsx
<input
  type="datetime-local"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
  className="min-h-[44px]"
/>
```

**Recurring Events:**
Phase 3 = basic text input for rrule string. Full UI builder can come later.

**Site Content:**
Keep it simple - structured forms, not WYSIWYG. Each section has predefined fields.

**Testing:**
Manual testing in browser, verify mobile with responsive design mode.

---

## ⚠️ Important Reminders

1. **File Size**: Keep all components under 200 lines
2. **Accessibility**: 44px touch targets, proper labels, keyboard nav
3. **Mobile-First**: Test responsive layouts
4. **Brand Colors**: Use sage (primary), terracotta (publish), destructive (delete)
5. **Error Handling**: User-friendly messages, console logging with `[Admin CMS]` prefix
6. **Authentication**: All API routes require admin auth
7. **Follow Patterns**: Use Phase 2 community-updates as reference

---

**Ready to begin Phase 3?** Copy the prompt above to start implementing Calendar Events and Site Content Management!

---

## 📊 Project Status After Phase 3

When Phase 3 is complete, the CMS will have:
- ✅ Community Updates (Phase 2)
- ✅ Calendar Events with Categories (Phase 3)
- ✅ Site Content Editors (Phase 3)
- ⏳ Home Page Dynamic Rendering (Phase 4)
- ⏳ Google Calendar Integration (Phase 5)
