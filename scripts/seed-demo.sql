-- Care Collective Demo Data Seed Script
-- This script creates demo users and help requests for testing and client demos
-- 
-- IMPORTANT: Run this in Supabase SQL Editor as a service role
-- This will bypass RLS policies to insert demo data

-- First, clean up any existing demo data (optional - uncomment if needed)
-- DELETE FROM help_requests WHERE user_id IN (
--   SELECT id FROM profiles WHERE email LIKE 'demo%@carecollective.local'
-- );
-- DELETE FROM auth.users WHERE email LIKE 'demo%@carecollective.local';

-- Create demo users in auth.users
-- Note: In production Supabase, you might need to use the Auth Admin API instead
-- For now, we'll create profiles directly and assume auth users exist

-- Insert demo profiles
INSERT INTO profiles (id, name, location, is_admin, created_at) VALUES
  -- Admin user
  ('a1111111-1111-1111-1111-111111111111', 'Sarah Admin', 'Springfield, MO', true, NOW() - INTERVAL '60 days'),
  
  -- Regular users
  ('b2222222-2222-2222-2222-222222222222', 'John Helper', 'Branson, MO', false, NOW() - INTERVAL '45 days'),
  ('c3333333-3333-3333-3333-333333333333', 'Mary Neighbor', 'Joplin, MO', false, NOW() - INTERVAL '30 days'),
  ('d4444444-4444-4444-4444-444444444444', 'Robert Elder', 'Springfield, MO', false, NOW() - INTERVAL '25 days'),
  ('e5555555-5555-5555-5555-555555555555', 'Linda Caregiver', 'Ozark, MO', false, NOW() - INTERVAL '20 days'),
  ('f6666666-6666-6666-6666-666666666666', 'James Volunteer', 'Nixa, MO', false, NOW() - INTERVAL '15 days'),
  ('g7777777-7777-7777-7777-777777777777', 'Patricia Parent', 'Republic, MO', false, NOW() - INTERVAL '10 days'),
  ('h8888888-8888-8888-8888-888888888888', 'Michael Student', 'Springfield, MO', false, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  is_admin = EXCLUDED.is_admin;

-- Insert demo help requests with various statuses
INSERT INTO help_requests (id, user_id, title, description, category, urgency, status, helper_id, created_at, updated_at) VALUES
  -- Open requests (need help)
  ('r1111111-1111-1111-1111-111111111111', 
   'd4444444-4444-4444-4444-444444444444', 
   'Need groceries from Walmart', 
   'I recently had surgery and cannot drive. Need someone to pick up my grocery list from Walmart. I can provide the list and payment in advance. Usually takes about 30-45 minutes.', 
   'groceries', 'urgent', 'open', NULL, 
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('r2222222-2222-2222-2222-222222222222', 
   'g7777777-7777-7777-7777-777777777777', 
   'Transportation to doctor appointment', 
   'Need a ride to my cardiologist appointment on Friday at 2 PM. The office is at Cox Medical Center South. I use a walker but can transfer myself into a car. Round trip should take about 2 hours.', 
   'transport', 'critical', 'open', NULL, 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  ('r3333333-3333-3333-3333-333333333333', 
   'c3333333-3333-3333-3333-333333333333', 
   'Help moving furniture this weekend', 
   'Moving to a new apartment on Saturday. Need help with heavy items like couch, bed, and dresser. I have a truck rented, just need an extra pair of hands. Should take 3-4 hours. Will provide lunch!', 
   'household', 'normal', 'open', NULL, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  ('r4444444-4444-4444-4444-444444444444', 
   'h8888888-8888-8888-8888-888888888888', 
   'Prescription pickup needed', 
   'My prescription is ready at CVS on National Ave but I am quarantined with COVID. Need someone to pick it up and leave it at my door. I can send payment via Venmo.', 
   'medical', 'urgent', 'open', NULL, 
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

  -- In Progress requests (being helped)
  ('r5555555-5555-5555-5555-555555555555', 
   'd4444444-4444-4444-4444-444444444444', 
   'Yard work assistance needed', 
   'My yard has gotten overgrown and I cannot manage it myself anymore. Need help with mowing, trimming bushes, and raking leaves. I have all the tools needed.', 
   'household', 'normal', 'in_progress', 
   'f6666666-6666-6666-6666-666666666666', 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours'),

  ('r6666666-6666-6666-6666-666666666666', 
   'c3333333-3333-3333-3333-333333333333', 
   'Computer help - virus removal', 
   'My computer is running very slowly and I think it has a virus. Need someone who knows computers to help clean it up and install antivirus software.', 
   'other', 'normal', 'in_progress', 
   'h8888888-8888-8888-8888-888888888888', 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  ('r7777777-7777-7777-7777-777777777777', 
   'g7777777-7777-7777-7777-777777777777', 
   'Meal prep for the week', 
   'Recovering from a broken arm and cannot cook. Would appreciate help preparing some simple meals that I can reheat during the week. I have all ingredients.', 
   'household', 'urgent', 'in_progress', 
   'e5555555-5555-5555-5555-555555555555', 
   NOW() - INTERVAL '18 hours', NOW() - INTERVAL '6 hours'),

  -- Completed requests
  ('r8888888-8888-8888-8888-888888888888', 
   'd4444444-4444-4444-4444-444444444444', 
   'Emergency pharmacy run', 
   'Ran out of insulin and pharmacy closes at 6 PM. Need someone to pick up my prescription before then.', 
   'medical', 'critical', 'completed', 
   'b2222222-2222-2222-2222-222222222222', 
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  ('r9999999-9999-9999-9999-999999999999', 
   'c3333333-3333-3333-3333-333333333333', 
   'Dog walking while recovering', 
   'Just had knee surgery and cannot walk my dog for 2 weeks. Need someone to walk him once a day. He is friendly and well-behaved.', 
   'other', 'normal', 'completed', 
   'f6666666-6666-6666-6666-666666666666', 
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),

  ('ra111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   'g7777777-7777-7777-7777-777777777777', 
   'Grocery delivery from Aldi', 
   'Need someone to pick up about 15 items from Aldi. I have a detailed list and reusable bags. Can pay cash or Venmo.', 
   'groceries', 'normal', 'completed', 
   'e5555555-5555-5555-5555-555555555555', 
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),

  ('rb222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   'h8888888-8888-8888-8888-888888888888', 
   'Tutoring in statistics', 
   'MSU student needing help with statistics homework. Looking for someone with math background for 2-hour session.', 
   'other', 'normal', 'completed', 
   'b2222222-2222-2222-2222-222222222222', 
   NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),

  -- Cancelled requests
  ('rc333333-cccc-cccc-cccc-cccccccccccc', 
   'd4444444-4444-4444-4444-444444444444', 
   'Snow removal from driveway', 
   'Need help clearing snow from my driveway after the storm. I have a bad back and cannot shovel.', 
   'household', 'urgent', 'cancelled', NULL, 
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),

  ('rd444444-dddd-dddd-dddd-dddddddddddd', 
   'c3333333-3333-3333-3333-333333333333', 
   'Ride to airport', 
   'Need a ride to Springfield airport for 6 AM flight on Tuesday. Will pay for gas plus $20.', 
   'transport', 'normal', 'cancelled', NULL, 
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

  -- More varied open requests for demo richness
  ('re555555-eeee-eeee-eeee-eeeeeeeeeeee', 
   'e5555555-5555-5555-5555-555555555555', 
   'Help installing grab bars in bathroom', 
   'Need someone handy to install safety grab bars in my shower and near toilet. I have the bars and mounting hardware already.', 
   'household', 'normal', 'open', NULL, 
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),

  ('rf666666-ffff-ffff-ffff-ffffffffffff', 
   'f6666666-6666-6666-6666-666666666666', 
   'Blood donation drive volunteer', 
   'Red Cross blood drive at my church needs volunteers to check in donors and serve refreshments. Saturday 9 AM - 1 PM.', 
   'other', 'normal', 'open', NULL, 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

  ('rg777777-gggg-gggg-gggg-gggggggggggg', 
   'b2222222-2222-2222-2222-222222222222', 
   'Emergency childcare needed', 
   'Babysitter cancelled last minute. Need someone to watch my 2 kids (ages 5 and 7) tomorrow 3-7 PM. They are well-behaved and love to read.', 
   'other', 'urgent', 'open', NULL, 
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  urgency = EXCLUDED.urgency,
  status = EXCLUDED.status,
  helper_id = EXCLUDED.helper_id;

-- Update timestamps for completed requests
UPDATE help_requests 
SET 
  helped_at = created_at + INTERVAL '2 hours',
  completed_at = created_at + INTERVAL '1 day'
WHERE status = 'completed';

-- Update timestamps for in_progress requests  
UPDATE help_requests 
SET helped_at = created_at + INTERVAL '4 hours'
WHERE status = 'in_progress';

-- Update timestamps for cancelled requests
UPDATE help_requests 
SET 
  cancelled_at = created_at + INTERVAL '1 day',
  cancel_reason = CASE 
    WHEN title LIKE '%Snow%' THEN 'Weather improved, no longer needed'
    WHEN title LIKE '%airport%' THEN 'Found alternative transportation'
    ELSE 'Request no longer needed'
  END
WHERE status = 'cancelled';

-- Insert some sample audit logs for admin actions
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, metadata, created_at) 
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  'status_change',
  'help_request',
  id,
  jsonb_build_object('status', 'open'),
  jsonb_build_object('status', status),
  jsonb_build_object('reason', 'Admin review'),
  updated_at
FROM help_requests 
WHERE status IN ('completed', 'cancelled')
LIMIT 5;

-- Create a summary view for the demo
CREATE OR REPLACE VIEW demo_summary AS
SELECT 
  'Demo Data Summary' as title,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_admin = true) as admin_users,
  (SELECT COUNT(*) FROM help_requests) as total_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'in_progress') as in_progress_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'completed') as completed_requests,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'cancelled') as cancelled_requests,
  (SELECT COUNT(DISTINCT helper_id) FROM help_requests WHERE helper_id IS NOT NULL) as active_helpers;

-- Grant access to the view
GRANT SELECT ON demo_summary TO anon, authenticated;

-- Display summary
SELECT * FROM demo_summary;