# Signup Bug - Root Cause Analysis

## Bug Summary
New users cannot log in after signup. Profile creation fails silently during registration.

---

## Root Cause
**Schema mismatch between production database and application code**

The production `profiles` table is missing columns that the signup flow expects, causing the profile creation trigger to fail silently.

---

## Technical Details

### Error in Production Logs
```
ERROR: column "terms_accepted_at" of relation "profiles" does not exist
Timestamp: 2025-11-06 18:47:32 UTC
```

### Code Flow

1. **User submits signup form** → `/app/signup/page.tsx`
   ```typescript
   // Lines 37-49
   await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         name: name,
         location: location,
         application_reason: applicationReason,
         terms_accepted_at: new Date().toISOString(),  // ⚠️ NOT IN DB
         terms_version: '1.0',                           // ⚠️ NOT IN DB
       },
     },
   })
   ```

2. **Auth user created** → Supabase `auth.users` table
   - User ID: `0ae2a228-06c7-4413-8e8f-f31e18617943`
   - Email: `playwright.testbot.care@gmail.com`
   - Metadata stored in `raw_user_meta_data` JSON column

3. **Trigger fires** → `handle_user_registration()` function
   - Triggered AFTER INSERT on `auth.users`
   - Attempts to create profile using metadata

4. **INSERT fails** → Missing columns error
   ```sql
   INSERT INTO public.profiles (
     id, name, location, application_reason,
     verification_status, applied_at, created_at
   ) VALUES (...)
   ```
   - Function tries to insert/reference `terms_accepted_at`
   - Column doesn't exist in production schema
   - SQL error thrown

5. **Error caught silently** → Exception handler
   ```sql
   EXCEPTION WHEN OTHERS THEN
     RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
     -- Continue with auth process even if profile creation fails
   END;
   ```
   - Error logged as WARNING (not visible to user)
   - Auth signup succeeds anyway
   - Profile never created

6. **Login attempt fails** → Profile query returns nothing
   - Login API route (`app/api/auth/login/route.ts:119-123`)
   - Queries: `SELECT verification_status, name FROM profiles WHERE id = ?`
   - No profile found → "Database error querying schema"

---

## Schema Comparison

### Local Database (Expected)
```sql
-- From migrations
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text,
  location text,
  application_reason text,
  verification_status verification_status_enum,
  applied_at timestamptz,
  created_at timestamptz,
  terms_accepted_at timestamptz,  -- ✅ EXISTS in migration
  terms_version text,              -- ✅ EXISTS in migration
  ...
);
```

### Production Database (Actual)
```sql
-- From information_schema query
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  name text,
  location text,
  application_reason text,
  verification_status USER-DEFINED,
  applied_at timestamptz,
  created_at timestamptz,
  -- ❌ terms_accepted_at MISSING
  -- ❌ terms_version MISSING
  ...
);
```

---

## Why This Happened

### Theory 1: Migration Not Applied (Most Likely)
- Migration file exists locally that adds `terms_accepted_at` and `terms_version`
- Migration was never run on production database
- Code was deployed expecting the new schema
- Database schema is out of sync

### Theory 2: Manual Schema Changes
- Someone manually modified production schema
- Removed or never added the terms columns
- Local migrations don't reflect production reality

### Theory 3: Rollback Without Code Sync
- Migration was applied, then rolled back
- Code was not updated to match rolled-back schema

---

## Impact

### Severity: **CRITICAL (P0) - BLOCKING BETA LAUNCH**

### Affected Users
- ✅ Existing users: Can log in (profiles exist)
- ⛔ New signups: Cannot log in after registration
- ⛔ Test accounts: Cannot create working test accounts

### User Experience
1. User fills out signup form
2. Form submits successfully
3. User redirected to `/waitlist` page (looks like success)
4. User tries to log in
5. **Error**: "Database error querying schema"
6. User is locked out with no clear resolution

---

## The Fix

### Option 1: Add Missing Columns to Production (Recommended)
```sql
-- Add missing columns to production database
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

-- Backfill existing users (optional)
UPDATE profiles
SET
  terms_accepted_at = created_at,
  terms_version = '1.0'
WHERE terms_accepted_at IS NULL;
```

**Pros:**
- Simple, direct fix
- Aligns production with code expectations
- No code changes needed

**Cons:**
- Requires database migration on production
- Need to coordinate deployment

### Option 2: Remove Terms Fields from Signup Code
```typescript
// app/signup/page.tsx - Remove these lines:
options: {
  data: {
    name: name,
    location: location,
    application_reason: applicationReason,
    // ❌ Remove these:
    // terms_accepted_at: new Date().toISOString(),
    // terms_version: '1.0',
  },
}
```

**Pros:**
- No database changes needed
- Immediate fix via code deployment

**Cons:**
- Loses terms acceptance tracking
- May break other code expecting these fields
- Doesn't address root schema drift issue

### Option 3: Make Trigger More Resilient
Update `handle_user_registration()` to handle missing columns gracefully.

**Pros:**
- Prevents future similar issues
- More robust error handling

**Cons:**
- Doesn't fix current signup failures
- Still need to handle missing data

---

## Recommended Solution

**Immediate Action (Next 1 hour):**

1. **Add missing columns to production**
   ```sql
   ALTER TABLE profiles
     ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
     ADD COLUMN IF NOT EXISTS terms_version text;
   ```

2. **Verify fix works**
   - Create new test account via UI
   - Confirm profile is created
   - Confirm login works

3. **Fix orphaned test account**
   ```sql
   UPDATE profiles
   SET terms_accepted_at = created_at,
       terms_version = '1.0'
   WHERE id = '0ae2a228-06c7-4413-8e8f-f31e18617943';
   ```

**Follow-up Actions (Before beta launch):**

1. **Schema audit**
   - Compare local migration files vs production schema
   - Document all differences
   - Create migration plan to sync

2. **Migration process**
   - Establish clear dev → staging → production migration workflow
   - Use Supabase CLI: `supabase db push` or manual SQL scripts
   - Version control all schema changes

3. **Monitoring**
   - Add alerting for profile creation failures
   - Log successful profile creation for verification
   - Monitor trigger errors in postgres logs

4. **Testing**
   - Add integration test: signup → logout → login
   - Test on staging before production
   - Verify all metadata fields work end-to-end

---

## Prevention

### Automated Checks
1. **Schema validation in CI/CD**
   - Compare migration files vs deployed schema
   - Fail build if schema drift detected

2. **Smoke tests after deployment**
   - Automated signup → login test
   - Alert if profile creation fails

### Process Improvements
1. **Migration checklist**
   - Run migrations on staging first
   - Verify schema matches code expectations
   - Test critical flows before production deploy

2. **Schema change review**
   - Require database review for schema changes
   - Document why columns are added/removed
   - Track schema versions

---

## Related Files

### Code Files
- `/app/signup/page.tsx` - Signup form that sends metadata
- `/app/api/auth/login/route.ts` - Login that queries profiles
- `/supabase/migrations/*` - Local schema definitions

### Database Objects
- `auth.users` - User authentication table
- `public.profiles` - User profile table (MISSING COLUMNS)
- `handle_user_registration()` - Trigger function
- `on_auth_user_created` - Trigger on auth.users INSERT

---

## Testing Checklist (After Fix)

- [ ] Add missing columns to production
- [ ] Create new test account via signup UI
- [ ] Verify profile created in database
- [ ] Log out
- [ ] Log in with new test account
- [ ] Verify dashboard loads correctly
- [ ] Delete test account
- [ ] Repeat test 2-3 times to confirm reliability
- [ ] Check postgres logs for any warnings
- [ ] Verify existing users still work

---

## Timeline

| Time | Event |
|------|-------|
| 2025-11-06 18:47 | Test bot signup attempted |
| 2025-11-06 18:47 | Profile creation failed (column not found) |
| 2025-11-06 18:47 | Auth user created successfully |
| 2025-11-06 18:52 | Login attempted, failed (no profile) |
| 2025-11-06 18:52 | Manual profile creation attempted |
| 2025-11-06 18:53 | Root cause identified in postgres logs |

---

**Status**: Root cause confirmed, awaiting fix implementation
**Priority**: P0 - CRITICAL - BLOCKING BETA LAUNCH
**Owner**: Development team
**Next Action**: Apply schema migration to production database
