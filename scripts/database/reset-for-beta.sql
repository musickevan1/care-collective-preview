-- Care Collective: Database Reset for Beta Testing
-- WARNING: This will DELETE ALL USER DATA
-- Only run this script if you are absolutely sure you want to reset the database
-- Preserves: Schema, RLS policies, functions, triggers, migrations

-- ============================================================================
-- SAFETY CHECK: Confirm this is a development/staging database
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '⚠️  DATABASE RESET SCRIPT STARTING...';
  RAISE NOTICE 'This will delete ALL user data while preserving schema.';
  RAISE NOTICE 'Press Ctrl+C within 5 seconds to cancel.';
  PERFORM pg_sleep(5);
  RAISE NOTICE '🔥 Proceeding with database reset...';
END $$;

-- ============================================================================
-- STEP 1: Delete from child tables first (avoid FK violations)
-- ============================================================================

-- Messaging V2 (Atomic system)
DELETE FROM messages_v2;
RAISE NOTICE '✅ Deleted messages_v2';

DELETE FROM conversations_v2;
RAISE NOTICE '✅ Deleted conversations_v2';

-- Messaging V1 (Legacy system)
DELETE FROM message_reports;
RAISE NOTICE '✅ Deleted message_reports';

DELETE FROM message_audit_log;
RAISE NOTICE '✅ Deleted message_audit_log';

DELETE FROM messages;
RAISE NOTICE '✅ Deleted messages';

DELETE FROM conversation_participants;
RAISE NOTICE '✅ Deleted conversation_participants';

DELETE FROM conversations;
RAISE NOTICE '✅ Deleted conversations';

DELETE FROM messaging_preferences;
RAISE NOTICE '✅ Deleted messaging_preferences';

-- Contact Exchange & Privacy
DELETE FROM contact_sharing_history;
RAISE NOTICE '✅ Deleted contact_sharing_history';

DELETE FROM contact_exchange_audit;
RAISE NOTICE '✅ Deleted contact_exchange_audit';

DELETE FROM contact_exchanges;
RAISE NOTICE '✅ Deleted contact_exchanges';

DELETE FROM privacy_violation_alerts;
RAISE NOTICE '✅ Deleted privacy_violation_alerts';

DELETE FROM data_export_requests;
RAISE NOTICE '✅ Deleted data_export_requests';

DELETE FROM user_privacy_settings;
RAISE NOTICE '✅ Deleted user_privacy_settings';

-- Help Requests
DELETE FROM help_requests;
RAISE NOTICE '✅ Deleted help_requests';

-- User Management
DELETE FROM user_restrictions;
RAISE NOTICE '✅ Deleted user_restrictions';

DELETE FROM verification_status_changes;
RAISE NOTICE '✅ Deleted verification_status_changes';

-- Audit Logs
DELETE FROM audit_logs;
RAISE NOTICE '✅ Deleted audit_logs';

-- ============================================================================
-- STEP 2: Delete from auth schema (Supabase auth tables)
-- ============================================================================

-- MFA claims
DELETE FROM auth.mfa_amr_claims;
RAISE NOTICE '✅ Deleted auth.mfa_amr_claims';

-- MFA challenges
DELETE FROM auth.mfa_challenges;
RAISE NOTICE '✅ Deleted auth.mfa_challenges';

-- MFA factors
DELETE FROM auth.mfa_factors;
RAISE NOTICE '✅ Deleted auth.mfa_factors';

-- Sessions
DELETE FROM auth.sessions;
RAISE NOTICE '✅ Deleted auth.sessions';

-- Refresh tokens
DELETE FROM auth.refresh_tokens;
RAISE NOTICE '✅ Deleted auth.refresh_tokens';

-- One-time tokens (email confirmation, password reset, etc.)
DELETE FROM auth.one_time_tokens;
RAISE NOTICE '✅ Deleted auth.one_time_tokens';

-- Identities (OAuth connections)
DELETE FROM auth.identities;
RAISE NOTICE '✅ Deleted auth.identities';

-- Users (this will cascade to profiles via trigger)
DELETE FROM auth.users;
RAISE NOTICE '✅ Deleted auth.users (will cascade to profiles)';

-- ============================================================================
-- STEP 3: Verify profiles table is empty
-- ============================================================================

-- Check if profiles were deleted by cascade
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;

  IF profile_count > 0 THEN
    -- Manual deletion if cascade didn't work
    DELETE FROM profiles;
    RAISE NOTICE '⚠️  Manually deleted % remaining profiles', profile_count;
  ELSE
    RAISE NOTICE '✅ Profiles table empty (cascade delete successful)';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Reset sequences (optional - start IDs from 1 again)
-- ============================================================================

-- Note: Most tables use UUIDs, so sequences might not exist
-- Uncomment if you have auto-incrementing integer IDs

-- ALTER SEQUENCE IF EXISTS help_requests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;

-- ============================================================================
-- STEP 5: Verification & Summary
-- ============================================================================

DO $$
DECLARE
  auth_user_count INTEGER;
  profile_count INTEGER;
  help_request_count INTEGER;
  message_count INTEGER;
  message_v2_count INTEGER;
  conversation_count INTEGER;
  conversation_v2_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO help_request_count FROM help_requests;
  SELECT COUNT(*) INTO message_count FROM messages;
  SELECT COUNT(*) INTO message_v2_count FROM messages_v2;
  SELECT COUNT(*) INTO conversation_count FROM conversations;
  SELECT COUNT(*) INTO conversation_v2_count FROM conversations_v2;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 DATABASE RESET COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verification:';
  RAISE NOTICE '   Auth Users: %', auth_user_count;
  RAISE NOTICE '   Profiles: %', profile_count;
  RAISE NOTICE '   Help Requests: %', help_request_count;
  RAISE NOTICE '   Messages (V1): %', message_count;
  RAISE NOTICE '   Messages (V2): %', message_v2_count;
  RAISE NOTICE '   Conversations (V1): %', conversation_count;
  RAISE NOTICE '   Conversations (V2): %', conversation_v2_count;
  RAISE NOTICE '';

  IF auth_user_count = 0 AND profile_count = 0 THEN
    RAISE NOTICE '✅ All user data successfully deleted';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Next Steps:';
    RAISE NOTICE '   1. Create admin accounts:';
    RAISE NOTICE '      node scripts/create-admin-user.js dev-admin@carecollective.com <password>';
    RAISE NOTICE '      node scripts/create-admin-user.js client-admin@carecollective.com <password>';
    RAISE NOTICE '   2. Create beta test users:';
    RAISE NOTICE '      node scripts/create-beta-users.js';
    RAISE NOTICE '   3. Seed test data (help requests, messages)';
  ELSE
    RAISE WARNING '⚠️  Some data may remain. Please verify manually.';
  END IF;
END $$;
