-- Migration: Create Calendar System tables
-- Description: Tables for calendar_events, event_categories, and google_calendar_sync
-- Author: Care Collective Team
-- Date: 2025-01-02

-- ============================================================================
-- 1. EVENT_CATEGORIES TABLE
-- ============================================================================
-- Event types (workshops, meetups, fundraisers, etc.)
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#7A9E99', -- Brand sage color as default
  icon TEXT, -- Lucide icon name
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_event_categories_slug ON event_categories(slug);
CREATE INDEX idx_event_categories_is_active ON event_categories(is_active);
CREATE INDEX idx_event_categories_display_order ON event_categories(display_order);

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_event_categories_updated_at
  BEFORE UPDATE ON event_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- ============================================================================
-- 2. CALENDAR_EVENTS TABLE
-- ============================================================================
-- Event management with categories and recurrence
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,

  -- Date and time
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Chicago', -- Default to Central Time (Missouri)

  -- Location
  location TEXT,
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'hybrid')),
  virtual_link TEXT, -- Zoom, Google Meet, etc.

  -- Recurrence (using iCal RRULE format)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE string (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
  recurrence_end_date TIMESTAMPTZ,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE, -- For recurring instances

  -- Google Calendar integration
  google_calendar_id TEXT, -- ID from Google Calendar
  google_calendar_event_id TEXT, -- Individual event ID
  last_synced_at TIMESTAMPTZ,

  -- Publishing workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'archived')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),

  -- Metadata
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT false,
  registration_link TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_recurrence CHECK (
    (is_recurring = false AND recurrence_rule IS NULL) OR
    (is_recurring = true AND recurrence_rule IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_calendar_events_category_id ON calendar_events(category_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_is_recurring ON calendar_events(is_recurring);
CREATE INDEX idx_calendar_events_parent_event_id ON calendar_events(parent_event_id);
CREATE INDEX idx_calendar_events_google_calendar_id ON calendar_events(google_calendar_id);
CREATE INDEX idx_calendar_events_published_at ON calendar_events(published_at DESC);

-- Composite index for common query pattern (published events by date)
CREATE INDEX idx_calendar_events_published_dates ON calendar_events(status, start_date, end_date)
  WHERE status = 'published';

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- ============================================================================
-- 3. GOOGLE_CALENDAR_SYNC TABLE
-- ============================================================================
-- Sync metadata and settings for Google Calendar integration
CREATE TABLE IF NOT EXISTS google_calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- OAuth credentials (encrypted)
  google_calendar_id TEXT NOT NULL UNIQUE, -- Primary Google Calendar ID
  access_token_encrypted TEXT, -- Store encrypted
  refresh_token_encrypted TEXT, -- Store encrypted
  token_expires_at TIMESTAMPTZ,

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('pull_only', 'push_only', 'bidirectional')),
  auto_sync_interval INTEGER DEFAULT 15, -- Minutes
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'partial')),
  last_sync_error TEXT,

  -- Sync statistics
  total_events_synced INTEGER DEFAULT 0,
  events_pulled INTEGER DEFAULT 0,
  events_pushed INTEGER DEFAULT 0,
  sync_conflicts INTEGER DEFAULT 0,

  -- Conflict resolution strategy
  conflict_resolution TEXT DEFAULT 'google_wins' CHECK (conflict_resolution IN ('google_wins', 'local_wins', 'manual')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_google_calendar_sync_calendar_id ON google_calendar_sync(google_calendar_id);
CREATE INDEX idx_google_calendar_sync_enabled ON google_calendar_sync(sync_enabled);
CREATE INDEX idx_google_calendar_sync_last_sync ON google_calendar_sync(last_sync_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER trigger_update_google_calendar_sync_updated_at
  BEFORE UPDATE ON google_calendar_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

-- ============================================================================
-- 4. SYNC_CONFLICT_LOG TABLE
-- ============================================================================
-- Log conflicts during Google Calendar sync
CREATE TABLE IF NOT EXISTS sync_conflict_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  google_event_id TEXT,
  conflict_type TEXT NOT NULL, -- 'update_conflict', 'delete_conflict', 'duplicate'
  local_version JSONB, -- Snapshot of local event
  google_version JSONB, -- Snapshot of Google Calendar event
  resolution TEXT CHECK (resolution IN ('pending', 'google_used', 'local_used', 'merged', 'ignored')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_conflict_log_event_id ON sync_conflict_log(event_id);
CREATE INDEX idx_sync_conflict_log_resolution ON sync_conflict_log(resolution);
CREATE INDEX idx_sync_conflict_log_created_at ON sync_conflict_log(created_at DESC);

-- ============================================================================
-- 5. RLS POLICIES - EVENT_CATEGORIES
-- ============================================================================
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "Public can read active event categories"
  ON event_categories
  FOR SELECT
  USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all event categories"
  ON event_categories
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

-- Admins can manage categories
CREATE POLICY "Admins can manage event categories"
  ON event_categories
  FOR ALL
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

-- ============================================================================
-- 6. RLS POLICIES - CALENDAR_EVENTS
-- ============================================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Public can read published calendar events"
  ON calendar_events
  FOR SELECT
  USING (status = 'published');

-- Admins can view all events
CREATE POLICY "Admins can view all calendar events"
  ON calendar_events
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

-- Admins can manage events
CREATE POLICY "Admins can manage calendar events"
  ON calendar_events
  FOR ALL
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

-- ============================================================================
-- 7. RLS POLICIES - GOOGLE_CALENDAR_SYNC
-- ============================================================================
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync settings
CREATE POLICY "Admins can view google calendar sync"
  ON google_calendar_sync
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

-- Only admins can manage sync settings
CREATE POLICY "Admins can manage google calendar sync"
  ON google_calendar_sync
  FOR ALL
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

-- ============================================================================
-- 8. RLS POLICIES - SYNC_CONFLICT_LOG
-- ============================================================================
ALTER TABLE sync_conflict_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view conflict logs
CREATE POLICY "Admins can view sync conflict logs"
  ON sync_conflict_log
  FOR ALL
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

-- ============================================================================
-- 9. AUDIT LOGGING TRIGGERS
-- ============================================================================
-- Apply audit trigger to event_categories
CREATE TRIGGER trigger_audit_event_categories
  AFTER INSERT OR UPDATE OR DELETE ON event_categories
  FOR EACH ROW
  EXECUTE FUNCTION log_content_change();

-- Apply audit trigger to calendar_events
CREATE TRIGGER trigger_audit_calendar_events
  AFTER INSERT OR UPDATE OR DELETE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION log_content_change();

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================
-- Function to get upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(
  limit_count INTEGER DEFAULT 10,
  category_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category_name TEXT,
  category_color TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  location_type TEXT,
  virtual_link TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.title,
    ce.description,
    ec.name AS category_name,
    ec.color AS category_color,
    ce.start_date,
    ce.end_date,
    ce.location,
    ce.location_type,
    ce.virtual_link
  FROM calendar_events ce
  LEFT JOIN event_categories ec ON ce.category_id = ec.id
  WHERE ce.status = 'published'
    AND ce.start_date >= NOW()
    AND (category_filter IS NULL OR ce.category_id = category_filter)
  ORDER BY ce.start_date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for event conflicts
CREATE OR REPLACE FUNCTION check_event_conflicts(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflicting_event_id UUID,
  conflicting_event_title TEXT,
  conflict_start TIMESTAMPTZ,
  conflict_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    title,
    start_date,
    end_date
  FROM calendar_events
  WHERE status != 'cancelled'
    AND (p_event_id IS NULL OR id != p_event_id)
    AND (
      (start_date, end_date) OVERLAPS (p_start_date, p_end_date)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. SEED DEFAULT CATEGORIES
-- ============================================================================
INSERT INTO event_categories (name, slug, description, color, icon, display_order) VALUES
('Community Meetup', 'community-meetup', 'Social gatherings and community building events', '#7A9E99', 'Users', 1),
('Workshop', 'workshop', 'Educational workshops and training sessions', '#BC6547', 'BookOpen', 2),
('Resource Sharing', 'resource-sharing', 'Events focused on sharing resources and skills', '#C39778', 'Gift', 3),
('Fundraiser', 'fundraiser', 'Fundraising events and campaigns', '#D8A8A0', 'Heart', 4),
('Volunteer', 'volunteer', 'Volunteer opportunities and service events', '#324158', 'Hand', 5),
('Other', 'other', 'Other community events', '#7A9E99', 'Calendar', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE event_categories IS 'Event types and categories for calendar system';
COMMENT ON TABLE calendar_events IS 'Calendar events with recurrence and Google Calendar integration';
COMMENT ON TABLE google_calendar_sync IS 'Google Calendar integration sync settings and metadata';
COMMENT ON TABLE sync_conflict_log IS 'Log of sync conflicts for manual resolution';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'iCal RRULE format for recurring events';
COMMENT ON COLUMN calendar_events.timezone IS 'IANA timezone identifier (e.g., America/Chicago)';
COMMENT ON FUNCTION get_upcoming_events IS 'Retrieve upcoming published events with optional category filter';
COMMENT ON FUNCTION check_event_conflicts IS 'Check for scheduling conflicts with other events';
