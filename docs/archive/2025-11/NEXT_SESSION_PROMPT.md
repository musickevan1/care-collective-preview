# Next Session: CMS Admin Panel Enhancement

## 📍 Current Status: Phase 1 Complete

### ✅ Phase 1 Completed (January 2, 2025)

**Database Infrastructure Created:**
- `site_content` table with draft/publish workflow (3 sections seeded)
- `community_updates` table for dynamic updates
- `content_revisions` table for version history
- `event_categories` table (6 categories seeded)
- `calendar_events` table with recurring event support
- `google_calendar_sync` table for integration
- `sync_conflict_log` table for conflict tracking

**Security & Features Implemented:**
- RLS policies (admin write, public read published)
- Audit logging for all content changes
- Draft/publish workflow
- Helper functions (`get_upcoming_events`, `check_event_conflicts`)
- iCal RRULE support for recurring events

**Migration Files:**
- `supabase/migrations/20250102000001_create_cms_tables.sql`
- `supabase/migrations/20250102000002_create_calendar_system.sql`

---

## 🚀 Next Session Prompt: Phase 2 Planning

```
I'm continuing the CMS admin panel enhancement project. Phase 1 (database schema) is complete.

Please create a detailed implementation plan for Phase 2: Admin UI Content Management Dashboard.

Requirements from initial planning:
- Editable sections: Events & Updates, Mission & Values, About/Story
- Editor type: Structured fields (forms) - NOT rich text or markdown
- Publishing workflow: Draft + Publish (with preview capability)
- All content changes must maintain accessibility (WCAG 2.1 AA)

Context:
- Review docs/context-engineering/master-plan.md for project status
- Current admin panel structure in app/admin/
- Existing admin components in components/admin/
- Admin authentication via lib/api/admin-auth.ts
- Database types should be in lib/database.types.ts

Plan should include:
1. Admin routes needed (file structure)
2. Components to build (with props/interfaces)
3. Form validation schemas (Zod)
4. API route architecture
5. Integration points with existing admin panel
6. Accessibility considerations
7. File organization (max 500 lines per file)
8. Step-by-step implementation order

Use the Task tool with subagent_type=Plan to research the existing admin structure before creating the plan.
```

---

## 📋 Remaining Phases Overview

### Phase 2: Admin UI - Content Management Dashboard (4-5 hours)
**Goal:** Build admin interface for editing home page sections

**Key Deliverables:**
- Content management dashboard overview page
- Section editor forms (Events & Updates, Mission, About)
- Publishing controls (draft, preview, publish)
- Preview modal for changes before publishing
- Revision history viewer

**Routes to Create:**
- `/admin/content` - Main dashboard
- `/admin/content/events-updates` - Edit events & updates
- `/admin/content/mission` - Edit mission & values
- `/admin/content/about` - Edit about section

**Components:**
- `ContentManagementDashboard`
- `SectionEditor` (reusable)
- `PublishingControls`
- `PreviewModal`
- `RevisionHistory`

**Technical Considerations:**
- Form validation with Zod
- Auto-save drafts every 30 seconds
- Diff view between draft and published
- WCAG 2.1 AA compliance for all forms
- Maximum 200 lines per component

---

### Phase 3: Admin UI - Calendar & Events System (5-6 hours)
**Goal:** Build comprehensive event management interface

**Key Deliverables:**
- Calendar dashboard with monthly view
- Event creation/editing forms
- Recurring event configuration
- Event category management
- Google Calendar OAuth setup UI
- Event list view with filters

**Routes to Create:**
- `/admin/calendar` - Main calendar view
- `/admin/calendar/events/new` - Create event
- `/admin/calendar/events/[id]` - Edit event
- `/admin/calendar/categories` - Manage categories
- `/admin/calendar/settings` - Google Calendar integration

**Components:**
- `CalendarDashboard` (use react-big-calendar or similar)
- `EventEditor` (form with date/time pickers)
- `RecurringEventForm` (rrule configuration)
- `CategoryManager` (CRUD interface)
- `GoogleCalendarConnect` (OAuth flow)

**Technical Considerations:**
- Calendar library integration
- Recurring event logic (rrule library)
- Conflict detection UI
- Color-coded event categories
- Two-way Google Calendar sync

---

### Phase 4: Home Page Dynamic Rendering (3-4 hours)
**Goal:** Convert static home page sections to fetch from database

**Key Changes:**
- Convert `app/page.tsx` sections to Server Components
- Fetch data from `site_content`, `calendar_events`, `community_updates`
- Show static fallback if no published data
- Implement ISR with cache invalidation on publish

**Sections to Convert:**
1. Events & Updates section → fetch from `calendar_events` + `community_updates`
2. Mission & Values section → fetch from `site_content` (mission key)
3. About/Story section → fetch from `site_content` (about key)

**Technical Considerations:**
- Server Components for data fetching
- Error boundaries for graceful failures
- Static fallback content
- Incremental Static Regeneration (ISR)
- Cache revalidation on content publish

---

### Phase 5: API Routes & Backend Services (4-5 hours)
**Goal:** Create API endpoints and business logic services

**API Routes to Create:**

**Content Management:**
- `POST /api/admin/content/sections` - Create/update section
- `GET /api/admin/content/sections/:id` - Get section with drafts
- `POST /api/admin/content/sections/:id/publish` - Publish draft
- `GET /api/admin/content/revisions/:id` - Get revision history

**Calendar & Events:**
- `POST /api/admin/calendar/events` - Create event
- `PUT /api/admin/calendar/events/:id` - Update event
- `DELETE /api/admin/calendar/events/:id` - Delete event
- `GET /api/admin/calendar/events` - List events with filters
- `POST /api/admin/calendar/categories` - Manage categories

**Google Calendar:**
- `POST /api/integrations/google-calendar/auth` - OAuth callback
- `POST /api/integrations/google-calendar/sync` - Manual sync trigger
- `GET /api/integrations/google-calendar/status` - Sync status

**Backend Services (lib/):**
- `ContentService` - CRUD with draft workflow
- `CalendarService` - Event management + recurrence logic
- `GoogleCalendarService` - OAuth + sync + conflict resolution
- `PublishingService` - Draft → publish transitions
- `RevisionService` - Version control + rollback

**Technical Considerations:**
- Input validation with Zod
- Error handling with proper status codes
- Admin authentication middleware
- Rate limiting on publish actions
- Audit logging for all operations

---

### Phase 6: Validation & Security (2-3 hours)
**Goal:** Comprehensive validation schemas and security measures

**Zod Schemas to Create:**
```typescript
// Content schemas
sectionSchema
communityUpdateSchema
contentRevisionSchema

// Calendar schemas
eventSchema
eventCategorySchema
recurringEventSchema
googleCalendarConfigSchema

// Publishing schemas
publishRequestSchema
previewRequestSchema
```

**Security Measures:**
- Sanitize all HTML input (DOMPurify)
- Validate all form submissions
- Rate limiting on publish actions
- Audit logging for content changes
- Environment variables for Google Calendar API keys
- CSRF protection on all write operations

**Input Validation Rules:**
- Title: 3-100 characters
- Description: max 500 characters
- Dates: valid datetime with end > start
- URLs: valid format for virtual links
- Content: sanitize HTML, check for XSS

---

### Phase 7: Testing & Quality Assurance (3-4 hours)
**Goal:** Achieve 80%+ test coverage for CMS functionality

**Test Categories:**

**1. Unit Tests:**
- Content CRUD operations
- Event recurrence logic
- Publishing workflow state transitions
- Google Calendar sync functions
- Validation schemas

**2. Integration Tests:**
- Admin content editing flow
- Event creation and publishing
- Draft preview functionality
- Calendar sync end-to-end

**3. Accessibility Tests:**
- WCAG 2.1 AA compliance for all forms
- Keyboard navigation
- Screen reader compatibility
- Form validation errors announced

**4. Performance Tests:**
- Home page load time with dynamic content
- Calendar render performance (100+ events)
- Google Calendar sync performance

**Testing Tools:**
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- Axe for accessibility testing

**Test Files to Create:**
- `__tests__/admin/content/ContentEditor.test.tsx`
- `__tests__/admin/calendar/EventEditor.test.tsx`
- `__tests__/lib/services/ContentService.test.ts`
- `__tests__/lib/services/CalendarService.test.ts`
- `__tests__/api/admin/content.test.ts`

---

### Phase 8: Documentation & Deployment (2 hours)
**Goal:** Document the CMS and deploy to production

**Documentation to Create:**

1. **Admin User Guide** (`docs/admin-cms-guide.md`)
   - How to edit home page sections
   - How to create and manage events
   - How to publish changes
   - How to preview before publishing
   - How to revert to previous versions

2. **Google Calendar Setup Guide** (`docs/google-calendar-setup.md`)
   - Obtaining Google Calendar API credentials
   - OAuth configuration
   - Setting up sync
   - Handling conflicts

3. **Technical Documentation** (`docs/cms-architecture.md`)
   - Database schema overview
   - API endpoints reference
   - Component hierarchy
   - Service layer architecture

4. **API Documentation** (`docs/api/admin-cms.md`)
   - All endpoint specifications
   - Request/response examples
   - Authentication requirements
   - Rate limits

**Deployment Checklist:**
- [ ] Run database migrations
- [ ] Update TypeScript types (`npm run db:types`)
- [ ] Set up Google Calendar API credentials
- [ ] Configure OAuth redirect URLs in Google Console
- [ ] Set environment variables in Vercel
- [ ] Run full test suite (`npm run test:coverage`)
- [ ] Type check (`npm run type-check`)
- [ ] Lint check (`npm run lint`)
- [ ] Build check (`npm run build`)
- [ ] Deploy to production (push to main - auto-deploys via Vercel)
- [ ] Verify all admin features in production
- [ ] Test Google Calendar OAuth flow in production
- [ ] Monitor logs for errors

**Environment Variables Needed:**
```env
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
```

---

## 🎯 Success Criteria

**Phase 2-8 Complete When:**
- [ ] Admin can edit all home page sections via UI
- [ ] Admin can create/edit/delete events
- [ ] Admin can configure recurring events
- [ ] Admin can preview changes before publishing
- [ ] Admin can view and restore previous versions
- [ ] Home page dynamically renders published content
- [ ] Google Calendar integration is functional
- [ ] All forms are accessible (WCAG 2.1 AA)
- [ ] Test coverage is 80%+
- [ ] Documentation is complete
- [ ] System is deployed and verified in production

---

## 📊 Estimated Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| ✅ Phase 1 | Database Schema & Migrations | 2-3 hours (COMPLETE) |
| Phase 2 | Admin UI - Content Management | 4-5 hours |
| Phase 3 | Admin UI - Calendar & Events | 5-6 hours |
| Phase 4 | Home Page Dynamic Rendering | 3-4 hours |
| Phase 5 | API Routes & Backend Services | 4-5 hours |
| Phase 6 | Validation & Security | 2-3 hours |
| Phase 7 | Testing & Quality Assurance | 3-4 hours |
| Phase 8 | Documentation & Deployment | 2 hours |
| **Total** | | **25-32 hours** |

---

## 🔗 Important File References

**Current Admin Structure:**
- Admin routes: `app/admin/`
- Admin components: `components/admin/`
- Admin auth: `lib/api/admin-auth.ts`
- Database types: `lib/database.types.ts`

**Project Guidelines:**
- Project instructions: `CLAUDE.md`
- Master plan: `docs/context-engineering/master-plan.md`
- PRP method: `docs/context-engineering/prp-method/`
- Phase plans: `docs/context-engineering/phase-plans/`

**Migration Files:**
- `supabase/migrations/20250102000001_create_cms_tables.sql`
- `supabase/migrations/20250102000002_create_calendar_system.sql`

---

## 💡 Notes for Next Session

**Before Starting Phase 2:**
1. Verify all migrations applied successfully
2. Confirm database types are current
3. Review existing admin panel structure
4. Understand admin authentication flow

**Key Technical Decisions Made:**
- Using structured forms (not rich text editor)
- Draft + Publish workflow (not immediate publish)
- Including all calendar features in Phase 3 (not splitting out Google Calendar)
- Targeting WCAG 2.1 AA compliance
- Following existing patterns from current admin panel

**Brand Colors (for UI):**
```css
--sage: #7A9E99;              /* Primary actions */
--dusty-rose: #D8A8A0;        /* Secondary accent */
--primary: #BC6547;           /* Terracotta */
--secondary: #324158;         /* Navy text */
--accent: #C39778;            /* Tan */
--background: #FBF2E9;        /* Cream */
--text: #483129;              /* Brown */
```

---

**Ready to begin Phase 2?** Copy the prompt above to start planning the Admin UI implementation!
