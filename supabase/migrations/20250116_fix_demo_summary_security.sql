-- Fix security issue with demo_summary view
-- Remove SECURITY DEFINER to use SECURITY INVOKER (default and safer)

-- Drop the existing view if it exists
-- The demo_summary view will be recreated by the seed.sql file with the correct schema
DROP VIEW IF EXISTS public.demo_summary;