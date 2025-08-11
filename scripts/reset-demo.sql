-- Care Collective Demo Data Reset Script
-- Use this to clean up and reset demo data between client demos

-- Step 1: Remove all help requests from demo users
DELETE FROM help_requests 
WHERE user_id IN (
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
  'e5555555-5555-5555-5555-555555555555',
  'f6666666-6666-6666-6666-666666666666',
  'g7777777-7777-7777-7777-777777777777',
  'h8888888-8888-8888-8888-888888888888'
);

-- Step 2: Remove demo audit logs
DELETE FROM audit_logs 
WHERE user_id = 'a1111111-1111-1111-1111-111111111111';

-- Step 3: Remove demo profiles
DELETE FROM profiles 
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
  'e5555555-5555-5555-5555-555555555555',
  'f6666666-6666-6666-6666-666666666666',
  'g7777777-7777-7777-7777-777777777777',
  'h8888888-8888-8888-8888-888888888888'
);

-- Step 4: Display confirmation
SELECT 
  'Demo data reset complete' as status,
  NOW() as reset_at;

-- To re-seed, run seed-demo.sql after this script