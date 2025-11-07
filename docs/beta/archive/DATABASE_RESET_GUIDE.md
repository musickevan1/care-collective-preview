# Database Reset Guide for Beta Testing

## 🎯 Overview

This guide explains how to completely reset the Care Collective database to provide a clean slate for beta testers.

**What gets deleted**:
- ❌ All user accounts and profiles
- ❌ All help requests
- ❌ All messages and conversations
- ❌ All contact exchanges
- ❌ All audit logs and test data

**What gets preserved**:
- ✅ Database schema and tables
- ✅ Migrations and RLS policies
- ✅ Functions and triggers
- ✅ All system configuration

---

## 🚀 Quick Start (3 Steps)

### Step 1: Reset Database
```bash
node scripts/reset-database-for-beta.js
```

Follow the prompts:
1. Type `yes` to confirm
2. Type `RESET DATABASE` to proceed
3. Wait for completion (~30 seconds)

### Step 2: Create Beta User Accounts
```bash
node scripts/create-beta-users.js
```

This creates 5 accounts for beta testers:
- Terry Barakat
- Ariadne Miranda
- Christy Conaway
- Keith Templeman
- Diane Musick

### Step 3: (Optional) Create Admin Account
```bash
node scripts/create-prod-admins.js
```

---

## 📋 Detailed Instructions

### Prerequisites

**Environment Variables Required**:
```bash
# Check your .env file has these:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
```

**Verify Connection**:
```bash
# Test Supabase connection
curl https://care-collective-preview.vercel.app
```

---

### Step-by-Step Process

#### 1. Backup Current Database (Optional but Recommended)

If you want to preserve any data before reset:

```bash
# Using Supabase CLI (if installed)
supabase db dump > backup-$(date +%Y%m%d).sql
```

Or export from Supabase Dashboard:
1. Go to Supabase project dashboard
2. Database → Backups
3. Create manual backup

#### 2. Run Database Reset Script

```bash
node scripts/reset-database-for-beta.js
```

**Expected Output**:
```
╔════════════════════════════════════════════════════════════════╗
║   🚨 DATABASE RESET FOR BETA TESTING 🚨                        ║
╚════════════════════════════════════════════════════════════════╝

⚠️  WARNING: This will DELETE ALL USER DATA from the database:
   ❌ All user accounts and profiles
   ❌ All help requests
   ...

Are you ABSOLUTELY SURE you want to reset the database? (yes/no): yes

⚠️  FINAL CONFIRMATION: Type "RESET DATABASE" to proceed: RESET DATABASE

🔥 Proceeding with database reset...

📝 Executing database reset script...

   ✅ Deleted Messages V2
   ✅ Deleted Conversations V2
   ...

🔐 Deleting auth users...
   Found 8 users to delete
   ✅ Deleted user: alice.test@carecollective.com
   ...

╔════════════════════════════════════════════════════════════════╗
║   🎉 DATABASE RESET COMPLETE                                   ║
╚════════════════════════════════════════════════════════════════╝

📊 Verification:
   Auth Users: 0
   Profiles: 0
   Help Requests: 0
   Messages: 0
   Conversations: 0

✅ All user data successfully deleted
```

#### 3. Create Beta Test Users

```bash
node scripts/create-beta-users.js
```

**Expected Output**:
```
🚀 Creating beta test users for Care Collective...

👤 Creating user: Terry Barakat (tmbarakat1958@gmail.com)
   ✅ Auth user created: ad12463a-...
   ✅ Profile created successfully

[... repeats for each user ...]

🎉 Beta User Creation Complete!

📋 Created Users:

   ✅ Terry Barakat
      Email: tmbarakat1958@gmail.com
      Password: CareTest2024!Terry
      Location: Springfield, MO
      User ID: ad12463a-...

[... shows all 5 users ...]

📊 Success Rate: 5/5 users created
```

#### 4. Verify Reset Was Successful

**Manual Verification**:

1. Visit: https://care-collective-preview.vercel.app/auth/login
2. Try logging in with a beta tester account
3. Check that dashboard is empty (no help requests)
4. Try creating a test help request
5. Verify messaging works

**Database Verification**:

```bash
# Using Supabase CLI
supabase db dump --schema public -f profiles help_requests messages_v2

# Or check via Supabase Dashboard:
# Database → Table Editor → Check tables are empty
```

---

## ⚠️ Safety Features

The reset script has multiple safety checks:

1. **Double Confirmation**: Requires typing "yes" AND "RESET DATABASE"
2. **Clear Warnings**: Shows exactly what will be deleted
3. **Database Verification**: Shows connection info before proceeding
4. **Post-Reset Validation**: Counts remaining records
5. **Service Role Required**: Needs admin-level access (won't work with regular keys)

---

## 🐛 Troubleshooting

### Error: Missing Environment Variables

```
❌ Missing required environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE
```

**Solution**:
1. Check `.env` file exists
2. Verify `SUPABASE_SERVICE_ROLE` key is set (not `SUPABASE_ANON_KEY`)
3. Get service role key from Supabase Dashboard → Settings → API

### Error: Permission Denied

```
❌ Error deleting user: permission denied
```

**Solution**:
- Verify you're using the SERVICE_ROLE key (not anon key)
- Service role key starts with `eyJ...` and bypasses RLS
- Find it in Supabase Dashboard → Settings → API → service_role (secret)

### Error: Some Data Remains

```
⚠️  Some data may remain. Please verify manually.
```

**Solution**:
1. Check Supabase Dashboard → Database → Table Editor
2. Manually delete remaining records
3. Check for orphaned records in junction tables
4. Re-run the reset script

### Script Hangs or Times Out

**Solution**:
1. Check internet connection
2. Verify Supabase project is online (not paused)
3. Check Supabase status: https://status.supabase.com
4. Try again in a few minutes

---

## 📊 What to Expect

### Timeline

- **Reset Script**: 30-60 seconds (depends on data volume)
- **Create Beta Users**: 10-20 seconds
- **Verification**: 2-3 minutes manual testing

### Data Counts After Reset

| Table | Expected Count |
|-------|----------------|
| auth.users | 5 (beta testers) |
| profiles | 5 (beta testers) |
| help_requests | 0 |
| messages_v2 | 0 |
| conversations_v2 | 0 |
| contact_exchanges | 0 |

---

## 🔄 If You Need to Reset Again

You can run the reset script multiple times safely. It will:
1. Delete all existing data
2. Preserve schema and migrations
3. Allow you to recreate accounts

**Typical reasons to reset again**:
- After test runs before official beta launch
- If test data gets corrupted
- To start over with fresh accounts
- After major bugs are fixed

---

## 📞 Need Help?

**Common Issues**:
- Check environment variables
- Verify Supabase connection
- Ensure service role key is correct
- Check Supabase project isn't paused

**Still stuck?**
- Check Supabase logs: Dashboard → Logs
- Review error messages carefully
- Verify database migrations are applied
- Check RLS policies aren't blocking operations

---

## ✅ Post-Reset Checklist

After resetting the database:

- [ ] Reset script completed successfully
- [ ] 5 beta user accounts created
- [ ] Can log in as a beta tester
- [ ] Dashboard shows no help requests
- [ ] Can create a new help request
- [ ] Messaging system works
- [ ] No console errors on pages
- [ ] Mobile view works correctly

**Once verified, you're ready to send beta invitations!**

---

## 🔗 Related Documentation

- [Beta Test Plan](./SIMPLE_BETA_PLAN.md) - Testing approach
- [Beta Test Users](./BETA_TEST_USERS.md) - Tester credentials
- [Welcome Email Template](./WELCOME_EMAIL_TEMPLATE.md) - Invitation email
- [Launch Checklist](./LAUNCH_CHECKLIST.md) - Full launch process

---

*Last Updated: November 2, 2025*
*For Care Collective Beta Testing*
