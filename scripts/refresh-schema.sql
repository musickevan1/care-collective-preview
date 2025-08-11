-- Refresh Supabase Schema Cache
-- Run this in Supabase SQL Editor if you get "schema cache" errors

-- Method 1: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Method 2: Alternative notification
SELECT pg_notify('pgrst', 'reload schema');

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;