# GitHub Repository Setup - Care Collective Preview

## ✅ Current Status
- ✅ All code is committed
- ✅ Git remote is configured (needs username update)
- ✅ Branch renamed to 'main'
- ✅ Ready to push

## 🚀 Quick Setup Steps

### 1. Update GitHub Username
Replace `YOUR_USERNAME` with your actual GitHub username:
```bash
git remote set-url origin https://github.com/[YOUR_USERNAME]/care-collective-preview.git
```

### 2. Create Repository on GitHub
1. Go to: https://github.com/new
2. Settings:
   - **Repository name:** `care-collective-preview`
   - **Description:** "Community mutual aid platform - Enhanced preview with status tracking"
   - **Visibility:** Public or Private (your choice)
   - ⚠️ **IMPORTANT:** Do NOT initialize with README, .gitignore, or license
3. Click "Create repository"

### 3. Push Your Code
```bash
git push -u origin main
```

## 📋 After Pushing to GitHub

### 1. Apply Database Migration (CRITICAL!)
Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/fagwisxdmfyyagzihnvh/sql/new) and run:
```sql
-- Copy the entire content from:
-- supabase/migrations/20250811082915_add_request_status_tracking.sql
```

### 2. Deploy to Vercel
1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select `care-collective-preview`
4. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./ (leave as-is)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

### 3. Add Environment Variables in Vercel

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://fagwisxdmfyyagzihnvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3dpc3hkbWZ5eWFnemlobnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTQyMDUsImV4cCI6MjA3MDE3MDIwNX0.AQkwUqSHySXm2GK6gEEiwzAe34f2ff1Gy8aO_f8iDyg
NEXT_PUBLIC_SITE_URL=[Your Vercel URL - update after first deploy]

# Admin Features
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3dpc3hkbWZ5eWFnemlobnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU5NDIwNSwiZXhwIjoyMDcwMTcwMjA1fQ.38OziF4QPRStGplNG-S3HytUIq7cW9Bozz32mejfxzM
NEXT_PUBLIC_PREVIEW_ADMIN=1
NEXT_PUBLIC_ADMIN_ALLOWLIST=client@example.com,admin@example.com

# Feature Flags (all false initially)
NEXT_PUBLIC_FEATURE_REALTIME=false
NEXT_PUBLIC_FEATURE_MESSAGING=false
NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false
NEXT_PUBLIC_FEATURE_SMART_MATCHING=false
NEXT_PUBLIC_FEATURE_GROUPS=false
NEXT_PUBLIC_FEATURE_EVENTS=false
NEXT_PUBLIC_FEATURE_PWA=false
```

### 4. Post-Deployment Configuration

#### Update Vercel URL
After first deployment:
1. Copy your Vercel URL (e.g., `care-collective-preview.vercel.app`)
2. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables
3. Redeploy

#### Configure Supabase
Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/fagwisxdmfyyagzihnvh/auth/url-configuration):
- **Site URL:** `https://[your-app].vercel.app`
- **Redirect URLs:** Add `https://[your-app].vercel.app/auth/callback`

## 🧪 Testing Checklist

After deployment, test:
- [ ] Homepage loads
- [ ] `/api/health` returns `{"status":"healthy"}`
- [ ] Sign up with email
- [ ] Email confirmation works
- [ ] Login successful
- [ ] Create help request
- [ ] View request details
- [ ] Offer to help (status changes)
- [ ] Complete request
- [ ] Admin panel access

## 📊 What's New in This Version

### Features
- ✅ Enhanced status tracking (5 states)
- ✅ Helper assignment and tracking
- ✅ Request detail pages with actions
- ✅ Admin write capabilities
- ✅ Status filtering
- ✅ Feature flag system

### Technical Improvements
- Database migrations with Supabase CLI
- Comprehensive development plan
- Setup verification scripts
- Better TypeScript types
- Improved error handling

## 🆘 Troubleshooting

### "Schema cache" errors
After running migration, if you see cache errors:
```sql
NOTIFY pgrst, 'reload schema';
```
Wait 2-3 minutes for cache to refresh.

### Build warnings
Supabase realtime warnings are normal and don't affect functionality.

### Authentication issues
Ensure redirect URLs in Supabase match your Vercel URL exactly.

---

**Ready to deploy!** Just update the GitHub username and follow the steps above.