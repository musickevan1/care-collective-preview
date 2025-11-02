-- Migration: Create CMS tables for content management
-- Description: Tables for site_content, community_updates, and content_revisions
-- Author: Care Collective Team
-- Date: 2025-01-02

-- ============================================================================
-- 1. SITE_CONTENT TABLE
-- ============================================================================
-- Stores editable page sections with draft/publish workflow
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE, -- 'events_updates', 'mission', 'about'
  content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible content structure
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_version JSONB, -- Last published content
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_site_content_section_key ON site_content(section_key);
CREATE INDEX idx_site_content_status ON site_content(status);
CREATE INDEX idx_site_content_published_at ON site_content(published_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- ============================================================================
-- 2. COMMUNITY_UPDATES TABLE
-- ============================================================================
-- Dynamic "What's Happening" community updates
CREATE TABLE IF NOT EXISTS community_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  highlight_value TEXT, -- e.g., "15 members", "23 requests"
  display_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_community_updates_status ON community_updates(status);
CREATE INDEX idx_community_updates_display_order ON community_updates(display_order);
CREATE INDEX idx_community_updates_published_at ON community_updates(published_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_community_updates_updated_at
  BEFORE UPDATE ON community_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- ============================================================================
-- 3. CONTENT_REVISIONS TABLE
-- ============================================================================
-- Version history for content rollback capability
CREATE TABLE IF NOT EXISTS content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'site_content', 'community_update', 'calendar_event'
  content_id UUID NOT NULL, -- References the original content
  content_snapshot JSONB NOT NULL, -- Full content at time of revision
  revision_number INTEGER NOT NULL,
  change_summary TEXT, -- Description of what changed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_content_revisions_content_type_id ON content_revisions(content_type, content_id);
CREATE INDEX idx_content_revisions_created_at ON content_revisions(created_at DESC);

-- ============================================================================
-- 4. RLS POLICIES - SITE_CONTENT
-- ============================================================================
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Public can read published content
CREATE POLICY "Public can read published site content"
  ON site_content
  FOR SELECT
  USING (status = 'published');

-- Admins can view all content (including drafts)
CREATE POLICY "Admins can view all site content"
  ON site_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can insert content
CREATE POLICY "Admins can insert site content"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can update content
CREATE POLICY "Admins can update site content"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can delete content
CREATE POLICY "Admins can delete site content"
  ON site_content
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- ============================================================================
-- 5. RLS POLICIES - COMMUNITY_UPDATES
-- ============================================================================
ALTER TABLE community_updates ENABLE ROW LEVEL SECURITY;

-- Public can read published updates
CREATE POLICY "Public can read published community updates"
  ON community_updates
  FOR SELECT
  USING (status = 'published');

-- Admins can view all updates
CREATE POLICY "Admins can view all community updates"
  ON community_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can insert updates
CREATE POLICY "Admins can insert community updates"
  ON community_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can update updates
CREATE POLICY "Admins can update community updates"
  ON community_updates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Admins can delete updates
CREATE POLICY "Admins can delete community updates"
  ON community_updates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- ============================================================================
-- 6. RLS POLICIES - CONTENT_REVISIONS
-- ============================================================================
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;

-- Only admins can view revisions
CREATE POLICY "Admins can view content revisions"
  ON content_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- Only admins can insert revisions (automatic via triggers)
CREATE POLICY "Admins can insert content revisions"
  ON content_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
      AND profiles.verification_status = 'approved'
    )
  );

-- ============================================================================
-- 7. AUDIT LOGGING TRIGGER
-- ============================================================================
-- Create audit log entries for content changes
CREATE OR REPLACE FUNCTION log_content_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to audit_logs table (using existing schema)
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to site_content
CREATE TRIGGER trigger_audit_site_content
  AFTER INSERT OR UPDATE OR DELETE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION log_content_change();

-- Apply audit trigger to community_updates
CREATE TRIGGER trigger_audit_community_updates
  AFTER INSERT OR UPDATE OR DELETE ON community_updates
  FOR EACH ROW
  EXECUTE FUNCTION log_content_change();

-- ============================================================================
-- 8. SEED DEFAULT CONTENT
-- ============================================================================
-- Insert default site content sections (in draft state)
INSERT INTO site_content (section_key, content, status, created_at) VALUES
(
  'events_updates',
  '{
    "events": [],
    "updates": []
  }'::jsonb,
  'draft',
  NOW()
),
(
  'mission',
  '{
    "mission_statement": "Building stronger communities through mutual aid and support",
    "values": [
      {
        "title": "Community",
        "description": "We believe in the power of neighbors helping neighbors",
        "icon": "Users"
      },
      {
        "title": "Support",
        "description": "Everyone deserves access to help when they need it",
        "icon": "Heart"
      },
      {
        "title": "Trust",
        "description": "Privacy and safety are our top priorities",
        "icon": "Shield"
      },
      {
        "title": "Growth",
        "description": "Together we can build resilient communities",
        "icon": "TrendingUp"
      }
    ]
  }'::jsonb,
  'draft',
  NOW()
),
(
  'about',
  '{
    "story": "Care Collective was born from a simple idea: communities are strongest when people help each other. We provide a platform for neighbors to connect, share resources, and build lasting relationships through mutual aid.",
    "partnership": {
      "description": "This platform is an academic partnership led by Dr. Maureen Templeman at Missouri State University, supported by a grant from the Southern Gerontological Society.",
      "lead": "Dr. Maureen Templeman",
      "institution": "Missouri State University",
      "grant": "Southern Gerontological Society"
    }
  }'::jsonb,
  'draft',
  NOW()
)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE site_content IS 'Editable page sections with draft/publish workflow';
COMMENT ON TABLE community_updates IS 'Dynamic community updates displayed on home page';
COMMENT ON TABLE content_revisions IS 'Version history for content rollback';
COMMENT ON COLUMN site_content.section_key IS 'Unique identifier for each editable section';
COMMENT ON COLUMN site_content.content IS 'Flexible JSONB structure for section content';
COMMENT ON COLUMN site_content.published_version IS 'Last published content snapshot';
