# Session A: Quick TypeScript Fixes

**Estimated time: 30 minutes**
**Focus: Non-messaging utilities and components**

---

## Prompt

Fix the remaining quick TypeScript errors in Care Collective. Focus ONLY on these files (do NOT touch messaging-related files):

### Target Files

| File | Error Type |
|------|------------|
| `components/notifications/NotificationItem.tsx` | null vs undefined |
| `components/ui/form-field.tsx` | spread types |
| `hooks/useSmoothScroll.ts` | Element.offsetHeight |
| `lib/auth/session-sync.ts` | undefined check |
| `lib/config/error-tracking.ts` | overload mismatch |
| `lib/db/queries.ts` | HelpRequestWithProfile type |
| `lib/email/templates.ts` | warningBox undefined |
| `lib/notifications/NotificationService.ts` | notification_type |
| `lib/privacy/user-controls.ts` | argument count, property access |
| `lib/security/contact-encryption.ts` | overload, type assignments |
| `lib/security/privacy-event-tracker.ts` | argument count, ErrorContext |

### Fix Approach

1. Read the file and understand the error
2. Apply minimal fixes (null coalescing, type assertions, optional chaining)
3. Avoid refactoring - just fix the type errors
4. Do NOT touch any files in `components/messaging/`, `hooks/useMessaging*`, or `lib/messaging/`

### Verification

After fixing, run:
```bash
npm run type-check 2>&1 | grep -v "\.test\." | grep -v "tests/" | grep -vE "(messaging|Message)"
```

### Commit

```bash
git add -A && git commit -m "fix: resolve TypeScript errors in utilities and components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Git Coordination Note

If running in parallel with Session B:
- First to finish: commit and push normally
- Second to finish: run `git pull --rebase` before committing
