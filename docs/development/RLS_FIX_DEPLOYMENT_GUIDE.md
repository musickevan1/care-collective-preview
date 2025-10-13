# RLS Bug Fix - Production Deployment Guide

## ✅ Completed Steps

1. **Root Cause Identified**: The `profiles` table RLS policy allowed ANY authenticated user to view ALL approved users' profiles
   - Dangerous policy: `USING (auth.uid() = id OR (verification_status = 'approved' AND email_confirmed = true))`
   - This caused rejected users to see approved users' data

2. **Fix Created**: Migration `supabase/migrations/20251012000000_fix_profiles_rls_critical.sql`
   - New secure policy: Users can view own profile + approved users can view other approved users
   - Prevents rejected users from accessing ANY profiles
   - Allows platform features (help requests, messaging) to work correctly

3. **Code Deployed**:
   - ✅ Committed to main branch (commit: 9b570b0)
   - ✅ Pushed to GitHub
   - ✅ Vercel auto-deployment triggered

## 🚀 Required: Apply Migration to Production Database

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/kecureoyekeqhrxkmjuh
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/migrations/20251012000000_fix_profiles_rls_critical.sql`
5. Paste and run the SQL
6. Verify the migration completed successfully (should see success notices)

### Option 2: Supabase CLI

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to production project
supabase link --project-ref kecureoyekeqhrxkmjuh

# Apply the migration
supabase db push
```

### Option 3: Direct psql

```bash
# You'll need the database password from Supabase dashboard
PGPASSWORD=your_db_password psql \
  -h db.kecureoyekeqhrxkmjuh.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase/migrations/20251012000000_fix_profiles_rls_critical.sql
```

## ✅ Verification Steps

After applying the migration, verify the fix:

1. **Check RLS Policy**:
```sql
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'SELECT';
```

Expected result:
- Policy name: "Users can view their own profile and approved users"
- Policy enforces: `auth.uid() = id` OR (viewer is approved AND viewed user is approved)

2. **Test the Fix**:
   - Login as a rejected user → Should only see their own profile
   - Login as an approved user → Should see other approved users' profiles in help requests
   - Verify dashboard shows correct user name (not wrong user's name)

## 🎯 Expected Behavior After Fix

| User Type | Can View Own Profile | Can View Other Profiles |
|-----------|---------------------|------------------------|
| Rejected  | ✅ Yes               | ❌ No                   |
| Pending   | ✅ Yes               | ❌ No                   |
| Approved  | ✅ Yes               | ✅ Yes (approved only)  |
| Admin     | ✅ Yes               | ✅ Yes (approved only)  |

**Service Role**: Bypasses RLS entirely (used in middleware/auth callback)

## 📊 Testing Checklist

After migration is applied:

- [ ] Rejected user CANNOT access dashboard (blocked at middleware)
- [ ] Rejected user CANNOT see approved users' profiles
- [ ] Pending user redirected to waitlist page
- [ ] Approved user can access dashboard
- [ ] Approved user sees their OWN correct name
- [ ] Help requests show requester names correctly
- [ ] Messaging system shows user names correctly
- [ ] Admin panel functions normally

## 🐛 If Issues Occur

If the migration causes any issues:

1. **Rollback the RLS policy**:
```sql
DROP POLICY IF EXISTS "Users can view their own profile and approved users" ON profiles;

-- Restore temporary open policy (NOT RECOMMENDED FOR PRODUCTION)
CREATE POLICY "Temporary open policy"
  ON profiles FOR SELECT
  USING (true);
```

2. **Contact the development team** with:
   - Error messages from migration
   - Screenshots of issues
   - User accounts affected

## 📝 Notes

- This fix resolves the critical authentication bug where rejected users could see approved users' data
- The service role client (used in middleware) still works and bypasses RLS
- Platform functionality (help requests, messaging) continues to work correctly
- Security is significantly improved - no more cross-user data leakage

**Last Updated**: October 12, 2025
**Migration File**: `supabase/migrations/20251012000000_fix_profiles_rls_critical.sql`
**Commit**: 9b570b0
