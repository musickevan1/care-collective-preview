-- Admin Account Setup Script for Care Collective Launch
-- This script documents the admin account creation process for the launch team
-- Run this in Supabase SQL Editor or via CLI

-- =====================================================
-- ADMIN ACCOUNT CREATION PROCESS
-- =====================================================

-- STEP 1: Collect admin team information
-- Required from Dr. Templeman:
-- - Full names
-- - Email addresses (must be registered in Supabase Auth)
-- - Desired admin level (see levels below)

-- Admin Permission Levels:
-- 1. super_admin - Full system access, can manage other admins
-- 2. content_admin - Content moderation, user management
-- 3. support_admin - User support, limited content management
-- 4. analytics_admin - Read-only access to analytics and reports

-- =====================================================
-- METHOD 1: Individual Admin Assignment
-- =====================================================

-- Update a single user to admin status
UPDATE profiles 
SET 
  is_admin = true,
  admin_level = 'content_admin',
  updated_at = NOW()
WHERE email = 'admin-email@example.com';

-- Verify admin status
SELECT 
  id,
  name,
  email,
  is_admin,
  admin_level,
  verification_status
FROM profiles 
WHERE is_admin = true
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 2: Bulk Admin Assignment
-- =====================================================

-- Create a temporary table with admin assignments
CREATE TEMP TABLE temp_admin_assignments (
  admin_email TEXT,
  admin_level TEXT
);

-- Insert admin assignments (replace with actual emails)
INSERT INTO temp_admin_assignments (admin_email, admin_level) VALUES
('evanmusick.dev@gmail.com', 'super_admin'),
('MaureenTempleman@missouristate.edu', 'super_admin');

-- Apply admin status to all users in the temp table
UPDATE profiles p
SET 
  is_admin = true,
  admin_level = ta.admin_level,
  updated_at = NOW()
FROM temp_admin_assignments ta
WHERE p.email = ta.admin_email;

-- Clean up temp table
DROP TABLE temp_admin_assignments;

-- =====================================================
-- VERIFICATION: List All Admin Accounts
-- =====================================================

-- View all admin accounts with details
SELECT 
  p.id,
  p.name,
  p.email,
  p.is_admin,
  p.admin_level,
  p.created_at as account_created,
  p.updated_at as last_updated,
  auth.email_confirmed,
  auth.last_sign_in_at
FROM profiles p
JOIN auth.users auth ON p.id = auth.id
WHERE p.is_admin = true
ORDER BY 
  CASE p.admin_level
    WHEN 'super_admin' THEN 1
    WHEN 'content_admin' THEN 2
    WHEN 'support_admin' THEN 3
    WHEN 'analytics_admin' THEN 4
  END,
  p.created_at DESC;

-- =====================================================
-- ROLLBACK: Remove Admin Access
-- =====================================================

-- Remove admin access from a single user
UPDATE profiles 
SET 
  is_admin = false,
  admin_level = NULL,
  updated_at = NOW()
WHERE email = 'admin-email@example.com';

-- =====================================================
-- POST-SETUP CHECKLIST
-- =====================================================

-- □ All admin accounts verified in Supabase Auth
-- □ Admin emails confirmed in auth.users table
-- □ is_admin = true for all launch team members
-- □ Correct admin_level assigned to each admin
-- □ Admin functionality tested for each account
-- □ Admin procedures documentation distributed

-- =====================================================
-- TESTING: Verify Admin Functionality
-- =====================================================

-- Test admin features with each account:
-- 1. Login to CARE Collective
-- 2. Access /admin panel
-- 3. Verify admin dashboard loads
-- 4. Test user management features
-- 5. Verify content moderation access
-- 6. Test admin-only routes

-- Expected results:
-- - Admin users can access /admin routes
-- - Admin users see admin navigation
-- - Non-admin users cannot access /admin
-- - Admin features work without errors
