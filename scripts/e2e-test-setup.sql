-- E2E Test Account Setup Script
-- Run this in Supabase SQL Editor with service role permissions
-- 
-- Creates test accounts for E2E testing that can be safely used
-- without affecting real user data.
--
-- IMPORTANT: These accounts use a test email domain and should
-- only be used for automated testing.

-- =============================================================================
-- TEST USER IDS (Deterministic for easy cleanup)
-- =============================================================================

-- Test Admin: e2e-admin@test.swmocarecollective.org
-- UUID: e2e00000-0000-0000-0000-000000000001

-- Test Member: e2e-member@test.swmocarecollective.org  
-- UUID: e2e00000-0000-0000-0000-000000000002

-- Test Helper: e2e-helper@test.swmocarecollective.org
-- UUID: e2e00000-0000-0000-0000-000000000003

-- =============================================================================
-- CREATE TEST PROFILES
-- =============================================================================

INSERT INTO profiles (id, name, location, is_admin, verification_status, email_confirmed, created_at)
VALUES 
  (
    'e2e00000-0000-0000-0000-000000000001'::uuid,
    '[E2E-TEST] Admin User',
    'Springfield, MO',
    true,
    'approved',
    true,
    NOW()
  ),
  (
    'e2e00000-0000-0000-0000-000000000002'::uuid,
    '[E2E-TEST] Member User',
    'Branson, MO',
    false,
    'approved',
    true,
    NOW()
  ),
  (
    'e2e00000-0000-0000-0000-000000000003'::uuid,
    '[E2E-TEST] Helper User',
    'Joplin, MO',
    false,
    'approved',
    true,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  is_admin = EXCLUDED.is_admin,
  verification_status = EXCLUDED.verification_status,
  email_confirmed = EXCLUDED.email_confirmed;

-- =============================================================================
-- CREATE TEST HELP REQUESTS
-- =============================================================================

INSERT INTO help_requests (id, user_id, title, description, category, urgency, status, created_at, updated_at)
VALUES
  (
    'e2e00000-1111-1111-1111-111111111111'::uuid,
    'e2e00000-0000-0000-0000-000000000002'::uuid,
    '[E2E-TEST] Need grocery pickup',
    'This is a test help request for E2E testing. Please do not respond to this request.',
    'groceries-meals',
    'normal',
    'open',
    NOW(),
    NOW()
  ),
  (
    'e2e00000-2222-2222-2222-222222222222'::uuid,
    'e2e00000-0000-0000-0000-000000000002'::uuid,
    '[E2E-TEST] Transportation needed',
    'This is a test help request for E2E testing. Please do not respond to this request.',
    'transportation-errands',
    'urgent',
    'open',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

SELECT 
  'Test Profiles Created' as status,
  COUNT(*) as count
FROM profiles 
WHERE name LIKE '[E2E-TEST]%';

SELECT 
  'Test Help Requests Created' as status,
  COUNT(*) as count
FROM help_requests 
WHERE title LIKE '[E2E-TEST]%';
