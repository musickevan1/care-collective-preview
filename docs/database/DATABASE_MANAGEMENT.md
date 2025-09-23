# Database Management - Care Collective Preview

This document provides instructions for managing the Supabase database used by the Care Collective Preview.

## Database Schema

The preview uses the following tables from the v9 schema:

### profiles
- `id` (uuid, primary key)
- `name` (text)
- `location` (text, nullable)
- `created_at` (timestamp)

### help_requests
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles)
- `title` (text)
- `description` (text, nullable)
- `category` (text: groceries, transport, household, medical, other)
- `urgency` (text: normal, urgent, critical)
- `status` (text: open, closed)
- `created_at` (timestamp)

### messages (optional, for future use)
- `id` (uuid, primary key)
- `request_id` (uuid, foreign key to help_requests)
- `sender_id` (uuid, foreign key to profiles)
- `recipient_id` (uuid, foreign key to profiles)
- `content` (text)
- `read` (boolean)
- `created_at` (timestamp)

## Data Reset Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fagwisxdmfyyagzihnvh`
3. Navigate to "SQL Editor"
4. Run the following SQL to clear preview data:

```sql
-- Clear help requests (this will also clear related messages due to foreign keys)
DELETE FROM help_requests;

-- Clear profiles (this will clear users but preserve auth.users)
DELETE FROM profiles;

-- Reset auto-increment sequences if needed
ALTER SEQUENCE help_requests_id_seq RESTART WITH 1;
```

### Option 2: Selective Reset

To keep some data and only clear specific records:

```sql
-- Clear help requests older than 7 days
DELETE FROM help_requests 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Clear test user profiles (keep real users)
DELETE FROM profiles 
WHERE name LIKE '%test%' OR name LIKE '%demo%';
```

### Option 3: Complete Reset (Use with Caution)

```sql
-- This will clear ALL data including real users
TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE help_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE profiles RESTART IDENTITY CASCADE;

-- Note: This does NOT clear auth.users table
-- Users will still be able to log in but will need to recreate profiles
```

## Seed Data for Demo

### Create Demo Users

```sql
-- Insert demo profiles (these need corresponding auth.users entries)
INSERT INTO profiles (id, name, location, created_at) VALUES
('demo-user-1', 'Alice Johnson', 'Springfield, MO', NOW() - INTERVAL '30 days'),
('demo-user-2', 'Bob Smith', 'Branson, MO', NOW() - INTERVAL '15 days'),
('demo-user-3', 'Carol Davis', 'Joplin, MO', NOW() - INTERVAL '7 days');
```

### Create Demo Help Requests

```sql
-- Insert demo help requests
INSERT INTO help_requests (user_id, title, description, category, urgency, status, created_at) VALUES
('demo-user-1', 'Need groceries picked up', 'I am recovering from surgery and need someone to pick up groceries from Walmart. I have a list ready and can pay via Venmo.', 'groceries', 'urgent', 'open', NOW() - INTERVAL '2 days'),
('demo-user-2', 'Help moving furniture', 'Moving to a new apartment this weekend and need help with heavy furniture. Pizza and drinks provided!', 'household', 'normal', 'open', NOW() - INTERVAL '1 day'),
('demo-user-3', 'Ride to medical appointment', 'Need transportation to doctor appointment on Friday at 2 PM. Appointment is at Mercy Hospital.', 'transport', 'urgent', 'open', NOW() - INTERVAL '3 hours'),
('demo-user-1', 'Dog walking while away', 'Going out of town for 3 days and need someone to walk my dog twice daily. Very friendly golden retriever.', 'other', 'normal', 'closed', NOW() - INTERVAL '5 days');
```

## Authentication Management

### View Auth Users

```sql
-- View all authenticated users (requires service role)
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;
```

### Clean Up Auth Users (Admin Only)

```sql
-- Delete specific auth user (use with extreme caution)
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Note: This should be done through Supabase dashboard for safety
```

## RLS Policies

The database uses Row Level Security (RLS). Current policies:

### profiles table
- Users can read all profiles
- Users can insert/update their own profile
- Service role can read/write all profiles

### help_requests table
- Users can read all open help requests
- Users can insert their own help requests
- Users can update their own help requests
- Service role can read/write all help requests

## Monitoring Queries

### Check Data Counts

```sql
-- Get current data counts
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM help_requests) as total_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM help_requests WHERE created_at > NOW() - INTERVAL '7 days') as recent_requests;
```

### Recent Activity

```sql
-- View recent help requests with user info
SELECT 
  hr.title,
  hr.category,
  hr.urgency,
  hr.status,
  hr.created_at,
  p.name as user_name,
  p.location
FROM help_requests hr
LEFT JOIN profiles p ON hr.user_id = p.id
ORDER BY hr.created_at DESC
LIMIT 10;
```

## Backup and Restore

### Create Backup

1. Go to Supabase Dashboard → Settings → Database
2. Click "Database Backups"
3. Create manual backup before major changes

### Export Data

```sql
-- Export help requests as CSV
COPY (
  SELECT hr.*, p.name as user_name, p.location as user_location
  FROM help_requests hr
  LEFT JOIN profiles p ON hr.user_id = p.id
) TO '/tmp/help_requests_backup.csv' WITH CSV HEADER;
```

## Client Demo Preparation

### Before Client Review

1. Clear old test data
2. Seed with 3-5 realistic demo requests
3. Create 2-3 demo user profiles
4. Verify all pages load correctly
5. Test auth flows work

### Demo Script

```sql
-- Quick demo setup
DELETE FROM help_requests WHERE created_at < NOW() - INTERVAL '1 day';
DELETE FROM profiles WHERE name LIKE '%test%';

-- Add fresh demo data
INSERT INTO help_requests (user_id, title, description, category, urgency, status, created_at) VALUES
(gen_random_uuid(), 'Need help with yard work', 'Looking for someone to help rake leaves this weekend. Will provide tools and refreshments.', 'household', 'normal', 'open', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'Grocery pickup needed', 'Elderly resident needs weekly grocery pickup from local store. Regular weekly arrangement preferred.', 'groceries', 'normal', 'open', NOW() - INTERVAL '1 day');
```

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Check if policies allow the operation
2. **Foreign key errors**: Ensure referenced users exist in profiles table
3. **Auth sync issues**: Profile creation might fail if auth.users entry missing

### Debug Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'help_requests');

-- Check foreign key constraints
SELECT * FROM help_requests hr 
LEFT JOIN profiles p ON hr.user_id = p.id 
WHERE p.id IS NULL;
```