# Demo Data Management Guide

## Overview
This guide explains how to manage demo data for client presentations and testing.

## Demo Users

### Admin User
- **ID**: `a1111111-1111-1111-1111-111111111111`
- **Name**: Sarah Admin
- **Location**: Springfield, MO
- **Role**: Administrator (can manage all requests)

### Regular Users
1. **John Helper** - Active volunteer from Branson
2. **Mary Neighbor** - Community member from Joplin  
3. **Robert Elder** - Senior citizen from Springfield
4. **Linda Caregiver** - Professional caregiver from Ozark
5. **James Volunteer** - Regular volunteer from Nixa
6. **Patricia Parent** - Parent from Republic
7. **Michael Student** - College student from Springfield

## Demo Requests

The seed script creates 16 help requests across different categories and statuses:

### Request Distribution
- **Open**: 7 requests (need help)
- **In Progress**: 3 requests (being helped)
- **Completed**: 4 requests (successfully helped)
- **Cancelled**: 2 requests (no longer needed)

### Categories
- Groceries (3 requests)
- Transport (2 requests)
- Household (5 requests)
- Medical (2 requests)
- Other (4 requests)

### Urgency Levels
- Critical: 2 requests
- Urgent: 5 requests
- Normal: 9 requests

## Managing Demo Data

### Initial Setup
1. Run the migrations in order:
   ```sql
   -- In Supabase SQL Editor, run these in sequence:
   -- 1. Initial schema (if not already applied)
   scripts/init-database.sql
   
   -- 2. Status tracking enhancement
   supabase/migrations/20250811082915_add_request_status_tracking.sql
   
   -- 3. Admin support
   supabase/migrations/20250811090000_add_admin_support.sql
   
   -- 4. Seed demo data
   scripts/seed-demo.sql
   ```

### Resetting Demo Data
To clean up after a demo and start fresh:

1. **Reset the data**:
   ```sql
   -- Run in Supabase SQL Editor
   scripts/reset-demo.sql
   ```

2. **Re-seed fresh data**:
   ```sql
   -- Run in Supabase SQL Editor
   scripts/seed-demo.sql
   ```

### Checking Demo Data Status
Run this query to see current demo data statistics:
```sql
SELECT * FROM demo_summary;
```

This will show:
- Total users
- Admin users count
- Total requests
- Requests by status
- Active helpers count

## Creating Auth Users for Demo

Since the demo profiles reference auth user IDs, you have two options:

### Option 1: Manual User Creation (Recommended for Demo)
1. Create users through your app's signup flow
2. Note their user IDs from the Supabase Auth dashboard
3. Update the profile to set admin status:
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE id = 'YOUR_ADMIN_USER_ID';
   ```

### Option 2: Use Supabase Auth Admin API
For automated demos, you can create auth users programmatically:

```javascript
// Example using Supabase Admin API
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@demo.local',
  password: 'DemoPassword123!',
  email_confirm: true,
  user_metadata: {
    name: 'Sarah Admin'
  }
});
```

## Demo Scenarios

### Scenario 1: User Needing Help
1. Log in as Robert Elder
2. View open requests
3. Create a new request for grocery help
4. See the request appear in the list

### Scenario 2: Volunteer Helping
1. Log in as John Helper
2. Browse open requests
3. Offer to help with a request
4. Mark it as in progress

### Scenario 3: Admin Management
1. Log in as Sarah Admin
2. Go to Admin panel
3. View all requests
4. Change request statuses
5. View audit logs

### Scenario 4: Request Lifecycle
1. Show an open request
2. Assign a helper (status → in_progress)
3. Complete the request (status → completed)
4. View the completed request with timestamps

## Troubleshooting

### Issue: Demo users can't log in
**Solution**: Demo profiles don't have corresponding auth users. Create auth users first, then update profile IDs to match.

### Issue: Admin can't modify requests
**Solution**: Ensure the admin migration has been applied and the user's `is_admin` flag is set to true.

### Issue: Duplicate key errors when seeding
**Solution**: Run the reset script first to clean up existing demo data.

### Issue: RLS policies blocking actions
**Solution**: Check that all migrations have been applied in order. Verify with:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Best Practices

1. **Always reset between demos** to ensure consistent state
2. **Test the full flow** before client demos
3. **Have backup admin account** in case of issues
4. **Document any custom demo data** added for specific clients
5. **Keep demo passwords secure** but easy to remember for live demos

## Quick Commands Reference

```bash
# Check setup status
node scripts/verify-setup.js

# View current demo data (in SQL Editor)
SELECT * FROM demo_summary;

# Reset and reseed (in SQL Editor)
-- Reset
scripts/reset-demo.sql
-- Seed
scripts/seed-demo.sql

# Make a user admin (in SQL Editor)
UPDATE profiles SET is_admin = true WHERE id = 'USER_ID';
```