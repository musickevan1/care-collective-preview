# File Size Violations - Refactoring Target List

This document lists all files that violate the project's file size limits. These files should be refactored to comply with the limits established in [`CLAUDE.md`](./CLAUDE.md):

- **Max 500 lines per file** (source files)
- **Components under 200 lines** (React components)
- **Functions under 50 lines** (general guideline)

---

## 📊 Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Components exceeding 200 lines | 28 | NEEDS REFACTORING |
| Library files exceeding 500 lines | 12 | NEEDS REFACTORING |
| API routes exceeding 300 lines | 2 | NEEDS REFACTORING |
| Test files exceeding 500 lines | 6 | OK (Tests OK at this size) |
| Total violations | **42** | Across 8 categories |

---

## 🔴 CRITICAL - Components Over 200 Lines (28 files)

These should be split into smaller, focused components.

### Tier 1 - Extreme (800+ lines)

| File | Lines | Content | Recommended Split |
|------|-------|---------|------------------|
| `/components/ContactExchange.tsx` | 998 | Contact info exchange with encryption | **5 components**: Header, Form, Status, Preview, Confirmation |
| `/components/privacy/PrivacyDashboard.tsx` | 942 | User privacy controls dashboard | **4 components**: SettingsPanel, ConsentTracker, AccessLog, DeletionManager |
| `/hooks/useRealTimeMessages.ts` | 792 | Real-time messaging hook | **2 files**: Hook for core logic, separate hook for typing indicators |
| `/components/admin/ModerationDashboard.tsx` | 791 | Content moderation interface | **3 components**: ModList, ModDetails, ActionPanel |

### Tier 2 - High (600-800 lines)

| File | Lines | Content | Recommended Split |
|------|-------|---------|------------------|
| `/lib/messaging/client.ts` | 767 | Messaging client service | **2 files**: Client core + conversation utils |
| `/lib/security/privacy-event-tracker.ts` | 707 | Privacy event tracking | **2 files**: Core tracker + event analysis |
| `/lib/privacy/user-controls.ts` | 697 | User privacy controls service | **2 files**: Controls manager + consent handler |
| `/components/admin/PrivacyDashboard.tsx` | 731 | Admin privacy dashboard | **3 components**: UserList, SettingsEditor, AuditLog |

### Tier 3 - Medium (400-600 lines)

| File | Lines | Content | Recommended Split |
|------|-------|---------|------------------|
| `/components/admin/AdminReportingDashboard.tsx` | 566 | Admin reporting interface | **3 components**: ReportsList, ReportDetails, FilterPanel |
| `/app/dashboard/page.tsx` | 562 | Dashboard page | **3 components**: Hero, Stats, RequestsList |
| `/lib/messaging/realtime.ts` | 543 | Real-time message handling | **2 files**: Connection handler + event processor |
| `/app/api/privacy/user-data/route.ts` | 537 | Privacy API route | **2 files**: Business logic to lib/, route handler |
| `/app/design-system/database/page.tsx` | 534 | Design system page | **2 pages**: Database schema + permissions reference |
| `/app/api/messaging/conversations/[id]/messages/route.ts` | 528 | Messaging API route | **2 files**: Business logic to lib/, route handler |
| `/components/messaging/VirtualizedMessageList.tsx` | 486 | Virtualized message rendering | **2 components**: List wrapper + message item renderer |
| `/components/admin/BulkUserActions.tsx` | 464 | Bulk user actions interface | **2 components**: ActionSelector + ExecutionMonitor |
| `/components/messaging/MessagingContext.tsx` | 456 | Messaging context provider | **2 files**: Context provider + hooks |
| `/lib/messaging/moderation.ts` | 597 | Content moderation service | **2 files**: Core moderation + pattern checker |

### Tier 4 - Moderate (300-400 lines)

| File | Lines | Content | Recommended Split |
|------|-------|---------|------------------|
| `/components/MobileNav.tsx` | 314 | Mobile navigation | **2 components**: Nav wrapper + menu items |
| `/components/admin/cms/CalendarEventsManager.tsx` | 501 | Calendar management interface | **2 components**: EventList + EventForm |
| `/lib/db/queries.ts` | 502 | Database queries | **3 files**: By domain (requests, messages, privacy) |
| `/lib/error-tracking.ts` | 462 | Error tracking service | **2 files**: Core tracking + analytics |
| `/components/FilterPanel.tsx` | 334 | Filter UI panel | **2 components**: Panel wrapper + filter items |
| `/components/help-requests/EditRequestForm.tsx` | 324 | Edit request form | **2 components**: FormSection components |
| `/components/HelpRequestCardWithMessaging.tsx` | 432 | Help request with messaging | **3 components**: Card, MessagingPanel, ActionButtons |
| `/components/PerformanceMonitor.tsx` | 403 | Performance monitoring | **2 components**: Monitor + metrics display |

---

## 🟡 CAUTION - API Routes Over 300 Lines (2 files)

These should extract business logic to `lib/` services and keep route handlers thin.

| File | Lines | Content | Recommended Action |
|------|-------|---------|------------------|
| `/app/api/privacy/user-data/route.ts` | 537 | Privacy data API | Extract logic to `lib/privacy/user-data-handler.ts` |
| `/app/api/messaging/conversations/[id]/messages/route.ts` | 528 | Messaging API | Extract logic to `lib/messaging/messages-handler.ts` |

**Pattern to follow:**
```typescript
// ✅ GOOD: Thin route handler
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const handler = new MessagesHandler();
  return handler.fetchMessages(params.id);
}

// In lib/messaging/messages-handler.ts:
export class MessagesHandler {
  async fetchMessages(conversationId: string) { /* 30 lines max */ }
}
```

---

## 🟠 WARNING - Library Files Over 500 Lines (12 files)

These should be split into focused, single-responsibility modules.

| File | Lines | Content | Recommended Split |
|------|-------|---------|------------------|
| `/lib/messaging/client.ts` | 767 | Messaging client service | Extract conversation utils |
| `/lib/security/privacy-event-tracker.ts` | 707 | Privacy event tracking | Extract event analysis |
| `/lib/privacy/user-controls.ts` | 697 | User privacy controls | Extract consent handler |
| `/lib/messaging/moderation.ts` | 597 | Content moderation | Extract pattern matcher |
| `/lib/messaging/realtime.ts` | 543 | Real-time handling | Extract event processor |
| `/lib/db/queries.ts` | 502 | Database queries | Split by domain |

**Pattern to follow:**
```typescript
// ❌ OLD: Single 700-line file
export class MessagingClient {
  // 150 lines for core
  // 150 lines for conversations
  // 150 lines for encryption
  // 150 lines for error handling
  // 100 lines for utils
}

// ✅ NEW: Focused modules
// lib/messaging/client.ts (150 lines)
export class MessagingClient { /* core only */ }

// lib/messaging/conversation-manager.ts (150 lines)
export class ConversationManager { /* conversations */ }

// lib/messaging/encryption.ts (100 lines)
export class EncryptionService { /* encryption */ }
```

---

## 🟢 OK - Test Files (6 files)

These are acceptable at their current size. Test files can exceed 500 lines:

| File | Lines | Status |
|------|-------|--------|
| `/lib/messaging/service-v2.test.ts` | 762 | OK - Comprehensive test suite |
| `/__tests__/api/messaging/messages.test.ts` | 759 | OK - API endpoint tests |
| `/tests/integration/user-journeys.test.tsx` | 754 | OK - Integration tests |
| `/__tests__/messaging/realtime.test.ts` | 694 | OK - Real-time tests |
| `/__tests__/messaging/ConversationList.test.tsx` | 566 | OK - Component tests |
| `/app/requests/new/page.test.tsx` | 547 | OK - Page tests |

---

## 📝 Refactoring Strategy

### Phase 1: Documentation ✅ COMPLETE
- Identify all violations (this document)
- Plan splits for each file
- Document patterns to follow

### Phase 2: Implementation (Next)
**Order of priority:**

1. **Critical (Blocks other work)**
   - `ContactExchange.tsx` (998 lines) - Split first
   - `PrivacyDashboard.tsx` (942 lines) - Split first
   - API routes - Move logic to lib/

2. **High (Improves maintainability)**
   - Large library services (700+ lines)
   - Other large components (600+ lines)

3. **Medium (Nice to have)**
   - Moderate components (300-400 lines)
   - Database query consolidation

4. **Low (Ongoing)**
   - Extract small utilities
   - Improve code organization

### Phase 3: Enforcement (Future)
- Add pre-commit hooks to prevent new violations
- Set up CI linting for file sizes
- Document patterns in component guidelines

---

## 🎯 Success Criteria

When refactoring is complete:

- ✅ All components under 200 lines
- ✅ All library files under 500 lines
- ✅ All API routes under 300 lines (logic in lib/)
- ✅ All functions under 50 lines
- ✅ 100% test coverage maintained
- ✅ No functionality broken
- ✅ TypeScript compiles (0 errors)
- ✅ All tests passing

---

## 📚 References

- See [`docs/guides/adding-features.md`](../guides/adding-features.md) for splitting patterns
- See [`docs/reference/component-patterns.md`](./component-patterns.md) for component architecture
- See [`CLAUDE.md`](./CLAUDE.md) for detailed guidelines

---

**Last Updated**: November 15, 2025
**Total Violations Documented**: 42 files
**Estimated Refactoring Time**: 40-60 hours (phased approach)
