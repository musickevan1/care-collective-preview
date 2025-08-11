# Supabase CLI Guide for Care Collective

## Overview

The Supabase CLI provides a better way to manage database migrations, local development, and deployment. This guide shows how to use it instead of manually running SQL in the dashboard.

## Initial Setup

### 1. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
# or use npx (already available)
npx supabase --version
```

### 2. Initialize Supabase Project (Already Done)
```bash
npx supabase init
```

This created the `supabase/` directory with:
- `config.toml` - Project configuration
- `migrations/` - Database migration files
- `functions/` - Edge functions (if needed)
- `seed.sql` - Seed data (optional)

### 3. Link to Remote Project
```bash
npx supabase link --project-ref fagwisxdmfyyagzihnvh
```
You'll need your database password from the Supabase dashboard:
1. Go to Settings → Database
2. Find the database password or reset it if needed

## Database Migrations

### Creating New Migrations

Instead of running SQL directly in the dashboard, create migration files:

```bash
# Create a new migration
npx supabase migration new <migration_name>

# Examples:
npx supabase migration new add_messaging_features
npx supabase migration new add_user_profiles_extended
npx supabase migration new add_realtime_support
```

This creates a timestamped file in `supabase/migrations/`:
- `20240811123456_add_messaging_features.sql`

### Migration File Structure

```sql
-- supabase/migrations/20240811123456_add_messaging_features.sql

-- Add new columns
ALTER TABLE messages 
  ADD COLUMN thread_id UUID,
  ADD COLUMN edited_at TIMESTAMP;

-- Create new tables
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_messages_thread ON messages(thread_id);

-- Update RLS policies
CREATE POLICY "Users can view their threads" 
  ON message_threads FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM thread_participants WHERE thread_id = id));
```

### Applying Migrations

```bash
# Apply migrations to remote database
npx supabase db push

# Or apply a specific migration
npx supabase db push --include-all
```

### Pulling Remote Schema

If changes were made directly in the dashboard:

```bash
# Pull remote schema changes
npx supabase db pull

# This creates a new migration file with the changes
```

## Local Development

### Start Local Supabase

```bash
# Start local Supabase instance
npx supabase start

# This starts:
# - PostgreSQL database (port 54322)
# - Auth server (port 54321)
# - Storage API
# - Realtime server
# - Edge Functions
```

### Local Environment Variables

Create `.env.local.development`:
```env
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE=<local-service-role>
```

### Stop Local Instance

```bash
npx supabase stop
```

## Database Management Commands

### Reset Database
```bash
# Reset local database
npx supabase db reset

# This runs all migrations from scratch
```

### Generate Types
```bash
# Generate TypeScript types from database schema
npx supabase gen types typescript --local > lib/database.types.ts

# Or from remote
npx supabase gen types typescript --project-id fagwisxdmfyyagzihnvh > lib/database.types.ts
```

### Seed Data
Create `supabase/seed.sql`:
```sql
-- Demo users (requires auth.users entries)
INSERT INTO profiles (id, name, location) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo User 1', 'Springfield, MO'),
  ('22222222-2222-2222-2222-222222222222', 'Demo User 2', 'Branson, MO');

-- Demo requests
INSERT INTO help_requests (user_id, title, category, urgency, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Need groceries', 'groceries', 'urgent', 'open');
```

Run seed:
```bash
npx supabase db seed
```

## Migration Workflow for Features

### Example: Adding Messaging Feature (Phase 1B)

1. **Create migration**:
```bash
npx supabase migration new add_messaging_system
```

2. **Edit migration file**:
```sql
-- supabase/migrations/[timestamp]_add_messaging_system.sql

-- Enhanced messages table
ALTER TABLE messages 
  ADD COLUMN thread_id UUID,
  ADD COLUMN parent_message_id UUID,
  ADD COLUMN edited_at TIMESTAMP,
  ADD COLUMN deleted_at TIMESTAMP;

-- Message threads
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES help_requests(id),
  participant_ids UUID[],
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_threads_participants ON message_threads USING GIN(participant_ids);

-- RLS policies
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their threads" 
  ON message_threads FOR SELECT 
  USING (auth.uid() = ANY(participant_ids));
```

3. **Test locally**:
```bash
npx supabase start
npx supabase db reset  # Applies all migrations
```

4. **Apply to production**:
```bash
npx supabase db push
```

## Best Practices

### 1. Migration Naming
- Use descriptive names: `add_user_skills`, `create_groups_table`
- Include feature phase: `phase1_add_realtime`, `phase2_advanced_profiles`

### 2. Migration Safety
- Always test locally first
- Include rollback commands in comments
- Never modify existing migrations after deployment

### 3. Version Control
- Commit migrations to git
- Review migrations in PRs
- Keep migrations small and focused

### 4. Documentation
```sql
-- Migration: Add user skills for Phase 2 Advanced Profiles
-- Author: [Your Name]
-- Date: 2024-08-11
-- Rollback: DROP TABLE user_skills;

CREATE TABLE user_skills (
  -- table definition
);
```

## Troubleshooting

### Connection Issues
```bash
# Check project status
npx supabase status

# Re-link project
npx supabase link --project-ref fagwisxdmfyyagzihnvh
```

### Migration Conflicts
```bash
# List migrations
npx supabase migration list

# Repair migration history
npx supabase migration repair --status applied
```

### Type Generation Issues
```bash
# Regenerate types after schema changes
npx supabase gen types typescript --project-id fagwisxdmfyyagzihnvh > lib/database.types.ts
```

## NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull",
    "db:migration": "supabase migration new",
    "db:types": "supabase gen types typescript --project-id fagwisxdmfyyagzihnvh > lib/database.types.ts",
    "db:seed": "supabase db seed"
  }
}
```

## Environment-Specific Configs

### Development
```bash
# Use local Supabase
npm run db:start
npm run dev
```

### Staging
```bash
# Use remote with different project
npx supabase link --project-ref <staging-project-ref>
npx supabase db push
```

### Production
```bash
# Use production project
npx supabase link --project-ref fagwisxdmfyyagzihnvh
npx supabase db push --confirm
```

## Next Steps

1. **Link your project**: Run `npx supabase link --project-ref fagwisxdmfyyagzihnvh` with your database password
2. **Generate types**: Run `npm run db:types` to get TypeScript types
3. **Create migrations**: Use `npx supabase migration new` for all future schema changes
4. **Test locally**: Use `npm run db:start` for local development

This approach provides:
- ✅ Version controlled database schema
- ✅ Reproducible migrations
- ✅ Local development environment
- ✅ Type safety with generated types
- ✅ Easy rollbacks and testing
- ✅ Team collaboration on schema changes