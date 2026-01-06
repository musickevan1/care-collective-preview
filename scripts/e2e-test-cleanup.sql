-- E2E Test Cleanup Script
-- Run this in Supabase SQL Editor to remove ALL test data
-- 
-- This script removes:
-- 1. All help requests with [E2E-TEST] prefix
-- 2. All conversations involving test accounts
-- 3. All messages in test conversations
-- 4. All notifications for test accounts
-- 5. Test profiles (optional - comment out if you want to keep accounts)

-- =============================================================================
-- CLEANUP ORDER (respects foreign key constraints)
-- =============================================================================

-- Step 1: Delete test messages (depends on conversations)
DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE participant1_id IN (
    SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
  )
  OR participant2_id IN (
    SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
  )
);

-- Step 2: Delete test conversations
DELETE FROM conversations 
WHERE participant1_id IN (
  SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
)
OR participant2_id IN (
  SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
);

-- Step 3: Delete test help requests
DELETE FROM help_requests 
WHERE title LIKE '[E2E-TEST]%'
   OR user_id IN (
     SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
   );

-- Step 4: Delete test notifications
DELETE FROM notifications 
WHERE user_id IN (
  SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
);

-- Step 5: Delete test contact exchanges (if table exists)
DELETE FROM contact_exchanges 
WHERE requester_id IN (
  SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
)
OR helper_id IN (
  SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%'
);

-- Step 6: OPTIONAL - Delete test profiles
-- Uncomment if you want to remove the test accounts entirely
-- Otherwise keep them for future test runs

-- DELETE FROM profiles WHERE name LIKE '[E2E-TEST]%';

-- =============================================================================
-- VERIFICATION: Confirm cleanup
-- =============================================================================

SELECT 
  'Remaining Test Help Requests' as check_type,
  COUNT(*) as count
FROM help_requests 
WHERE title LIKE '[E2E-TEST]%';

SELECT 
  'Remaining Test Conversations' as check_type,
  COUNT(*) as count
FROM conversations 
WHERE participant1_id IN (SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%')
   OR participant2_id IN (SELECT id FROM profiles WHERE name LIKE '[E2E-TEST]%');

SELECT 
  'Remaining Test Profiles' as check_type,
  COUNT(*) as count
FROM profiles 
WHERE name LIKE '[E2E-TEST]%';

-- If all counts are 0 (or profiles count matches expected), cleanup is complete
