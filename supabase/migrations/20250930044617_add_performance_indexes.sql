-- Performance Indexes for Care Collective
-- Phase 3.2 Beta Launch Preparation
-- Created: 2025-09-30

-- =====================================================
-- Help Requests Performance Indexes
-- =====================================================

-- Index for browsing open requests (most common query)
-- Optimizes: WHERE status = 'open' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_help_requests_status_created
  ON help_requests(status, created_at DESC);

-- Index for category and urgency filtering
-- Optimizes: WHERE category = X AND urgency = Y
CREATE INDEX IF NOT EXISTS idx_help_requests_category_urgency
  ON help_requests(category, urgency);

-- Index for user's help requests
-- Optimizes: WHERE user_id = X AND status = Y
CREATE INDEX IF NOT EXISTS idx_help_requests_user_status
  ON help_requests(user_id, status);

-- =====================================================
-- Messaging Performance Indexes
-- =====================================================

-- Index for loading conversation messages
-- Optimizes: WHERE conversation_id = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- Index for unread messages
-- Optimizes: WHERE recipient_id = X AND read_at IS NULL
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read
  ON messages(recipient_id, read_at);

-- =====================================================
-- Full-Text Search Optimization
-- =====================================================

-- GIN index for full-text search on help requests
-- Optimizes: Search functionality for title and description
CREATE INDEX IF NOT EXISTS idx_help_requests_search
  ON help_requests
  USING GIN(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- =====================================================
-- Index Creation Notes
-- =====================================================
-- Note: CONCURRENTLY removed for compatibility with Supabase SQL Editor
-- Safe for beta launch with low traffic and small dataset
-- These indexes significantly improve query performance under load
-- Estimated performance improvement: 5-10x for common queries