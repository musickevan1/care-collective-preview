# Care Collective Scripts

This directory contains utility scripts for managing the Care Collective application.

## Available Scripts

### 🔧 verify-setup.js
Verifies that your development environment is properly configured.

**Usage:**
```bash
node scripts/verify-setup.js
```

**What it checks:**
- ✅ Environment variables (.env.local)
- ✅ Project structure (directories and files)
- ✅ Dependencies (package.json)
- ✅ Supabase connection
- ✅ Database schema

**Output:**
- Green checkmarks (✓) indicate successful checks
- Red X marks (✗) indicate issues that need fixing
- Yellow warnings (⚠) indicate non-critical issues
- Blue info (ℹ) provides additional information

### 📊 init-database.sql
SQL script to initialize the Supabase database with the required schema.

**Usage:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to "SQL Editor"
4. Copy and paste the contents of `init-database.sql`
5. Click "Run" to execute

**What it creates:**
- `profiles` table - User profiles
- `help_requests` table - Community help requests
- `messages` table - User messaging (for future use)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic profile creation

## Running Scripts in Order

For initial setup:
1. First, ensure you have `.env.local` configured with your Supabase credentials
2. Run `init-database.sql` in Supabase SQL Editor to create tables
3. Run `node scripts/verify-setup.js` to verify everything is working

## Troubleshooting

### Database Connection Issues
If the verify script shows database connection errors:
1. Check your Supabase credentials in `.env.local`
2. Ensure the database tables exist (run `init-database.sql`)
3. Verify your Supabase project is active and not paused

### Missing Dependencies
If dependencies are missing:
```bash
npm install
```

### Environment Variables
If environment variables are not found:
1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials from the Supabase dashboard

## Feature Flags

The verify script will suggest feature flags to add to your `.env.local`:

```env
# Phase 1 Features
NEXT_PUBLIC_FEATURE_REALTIME=false
NEXT_PUBLIC_FEATURE_MESSAGING=false

# Phase 2 Features
NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false
NEXT_PUBLIC_FEATURE_SMART_MATCHING=false

# Phase 3 Features
NEXT_PUBLIC_FEATURE_GROUPS=false
NEXT_PUBLIC_FEATURE_EVENTS=false

# Phase 5 Features
NEXT_PUBLIC_FEATURE_PWA=false
```

Set these to `true` as you implement each feature according to the DEVELOPMENT_PLAN.md.