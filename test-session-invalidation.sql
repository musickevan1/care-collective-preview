-- Test Session Invalidation System
-- Run this in Supabase SQL Editor

-- Step 1: Check current users
SELECT
  id,
  email,
  name,
  verification_status
FROM profiles
WHERE verification_status = 'approved'
LIMIT 5;

-- Step 2: Choose a test user and update their status
-- REPLACE 'USER_ID_HERE' with an actual user ID from above
/*
UPDATE profiles
SET verification_status = 'rejected'
WHERE id = 'USER_ID_HERE';
*/

-- Step 3: Verify the trigger logged the change
SELECT
  user_id,
  old_status,
  new_status,
  changed_at,
  session_invalidated,
  notes
FROM verification_status_changes
ORDER BY changed_at DESC
LIMIT 5;

-- Step 4: Test the has_pending_session_invalidation function
-- REPLACE 'USER_ID_HERE' with the user ID you changed
/*
SELECT has_pending_session_invalidation('USER_ID_HERE'::uuid) as has_pending;
*/
-- Expected: Should return TRUE if status was changed to rejected

-- Step 5: Simulate marking session as invalidated
-- (This would normally be done by middleware after sign-out)
/*
SELECT mark_session_invalidated('USER_ID_HERE'::uuid);
*/

-- Step 6: Verify session was marked as invalidated
SELECT
  user_id,
  old_status,
  new_status,
  session_invalidated,
  session_invalidated_at,
  changed_at
FROM verification_status_changes
WHERE user_id = 'USER_ID_HERE'::uuid
ORDER BY changed_at DESC
LIMIT 1;
-- Expected: session_invalidated should be TRUE and session_invalidated_at should be set

-- Step 7: Cleanup - Set user back to approved if needed
/*
UPDATE profiles
SET verification_status = 'approved'
WHERE id = 'USER_ID_HERE';
*/
