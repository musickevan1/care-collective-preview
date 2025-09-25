# Deployment Checklist for Care Collective

> **⚠️ SECURITY WARNING**: This checklist contains placeholder credentials. Replace ALL placeholder values with your actual Supabase project credentials before deployment. Never commit real credentials to version control.

## 📋 Pre-Deployment Steps

### 1. Database Migration (REQUIRED)
**⚠️ Must be done BEFORE deploying to avoid errors**

Go to your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new) and run:

```sql
-- Migration: Add enhanced request status tracking
-- Copy the entire content from: supabase/migrations/20250811082915_add_request_status_tracking.sql

ALTER TABLE help_requests 
  DROP CONSTRAINT IF EXISTS help_requests_status_check;

ALTER TABLE help_requests 
  ADD CONSTRAINT help_requests_status_check 
  CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'closed'));

-- (Run the complete migration file content)
```

### 2. GitHub Repository Setup
- [ ] Create new GitHub repository: `care-collective-preview`
- [ ] Add remote: `git remote add origin https://github.com/[username]/care-collective-preview.git`
- [ ] Push code: `git push -u origin master`

## 🚀 Vercel Deployment

### 1. Import Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New Project"
- [ ] Import GitHub repository
- [ ] **IMPORTANT**: Leave Project Root as-is (don't set to subdirectory)

### 2. Environment Variables
Add these in Vercel project settings:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SITE_URL=[Will be updated after deployment]

# Optional (for admin features)
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here
NEXT_PUBLIC_PREVIEW_ADMIN=1
NEXT_PUBLIC_ADMIN_ALLOWLIST=client@example.com,admin@example.com

# Feature Flags (all set to false initially)
NEXT_PUBLIC_FEATURE_REALTIME=false
NEXT_PUBLIC_FEATURE_MESSAGING=false
NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false
NEXT_PUBLIC_FEATURE_SMART_MATCHING=false
NEXT_PUBLIC_FEATURE_GROUPS=false
NEXT_PUBLIC_FEATURE_EVENTS=false
NEXT_PUBLIC_FEATURE_PWA=false
```

### 3. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Note the deployment URL (e.g., `care-collective-preview.vercel.app`)

## 🔧 Post-Deployment Configuration

### 1. Update Environment Variables
- [ ] Update `NEXT_PUBLIC_SITE_URL` with actual Vercel URL
- [ ] Trigger redeploy from Vercel dashboard

### 2. Configure Supabase
Go to your Supabase Auth Settings (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration):
- [ ] Set Site URL: `https://[your-app].vercel.app`
- [ ] Add to Redirect URLs: `https://[your-app].vercel.app/auth/callback`

### 3. Verify Schema Cache
If you see "schema cache" errors:
1. Go to Supabase SQL Editor
2. Run: `NOTIFY pgrst, 'reload schema';`
3. Wait 2-3 minutes for cache to refresh

## ✅ Testing Checklist

### Basic Functionality
- [ ] Homepage loads without errors
- [ ] `/api/health` returns `{"status":"healthy"}`
- [ ] Sign up with email works
- [ ] Email confirmation received
- [ ] Login works after confirmation
- [ ] Dashboard displays user data

### Request Management
- [ ] Create new help request
- [ ] View all requests at `/requests`
- [ ] Filter requests by status
- [ ] View request details
- [ ] Offer to help (changes status to in_progress)
- [ ] Complete request
- [ ] Cancel request with reason

### Admin Panel
- [ ] Access `/admin` with allowlisted email
- [ ] View request statistics
- [ ] View all help requests
- [ ] Admin actions work (if not in preview mode)

## 🎯 Features Status

Current implementation status:
- ✅ User authentication (Supabase)
- ✅ Request creation and browsing
- ✅ Enhanced status tracking (5 states)
- ✅ Helper assignment
- ✅ Request detail pages
- ✅ Admin panel with write capabilities
- ✅ Feature flag system
- ⏳ Messaging system (Phase 1B)
- ⏳ Real-time updates (Phase 1A)
- ⏳ Advanced profiles (Phase 2)

## 📱 Share with Client

Once deployed and tested:
```
Main Application: https://[your-app].vercel.app
Admin Panel: https://[your-app].vercel.app/admin

Test Account:
Email: [create test account]
Password: [secure password]

Admin Access:
Add client email to NEXT_PUBLIC_ADMIN_ALLOWLIST environment variable
```

## 🐛 Troubleshooting

### Common Issues

1. **"Could not find table in schema cache"**
   - Tables exist but cache needs refresh
   - Run: `NOTIFY pgrst, 'reload schema';` in SQL Editor
   - Wait 2-3 minutes

2. **Authentication redirect fails**
   - Check Supabase redirect URLs match exactly
   - Include trailing slashes if needed

3. **Admin panel shows preview mode**
   - Verify SUPABASE_SERVICE_ROLE is set
   - Check NEXT_PUBLIC_PREVIEW_ADMIN value

4. **Build fails on Vercel**
   - Check build logs for TypeScript errors
   - Ensure all imports are correct
   - Verify environment variables are set

## 📊 Monitoring

- **Vercel Dashboard**: Build logs, function logs, analytics
- **Supabase Dashboard**: Database metrics, auth logs
- **Application Health**: `/api/health` endpoint

## 🔄 Updates

To deploy updates:
1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Vercel auto-deploys from master branch

## 📝 Notes

- Database migrations are NOT auto-applied
- Always run migrations manually in Supabase first
- Feature flags allow gradual feature rollout
- Admin write capabilities controlled by environment variable

---

**Last Updated**: August 11, 2025
**Version**: 1.0.0 - Enhanced Status Tracking Release