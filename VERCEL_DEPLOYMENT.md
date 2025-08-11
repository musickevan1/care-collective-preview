# Vercel Deployment Guide - Care Collective Preview

This document provides step-by-step instructions for deploying the Care Collective Preview to Vercel.

## Prerequisites

- Vercel account
- GitHub repository with the care-collective-preview code
- Supabase project (using existing v10 configuration)

## Deployment Steps

### 1. Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Project Root** to: `care-collective-preview`
5. Framework: Next.js (auto-detected)
6. Build Command: `next build` (default)
7. Output Directory: `.next` (default)

### 2. Environment Variables

Add the following environment variables in Vercel Project Settings:

#### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://fagwisxdmfyyagzihnvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3dpc3hkbWZ5eWFnemlobnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTQyMDUsImV4cCI6MjA3MDE3MDIwNX0.AQkwUqSHySXm2GK6gEEiwzAe34f2ff1Gy8aO_f8iDyg
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
```

#### Optional Variables (for admin features)
```
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZ3dpc3hkbWZ5eWFnemlobnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU5NDIwNSwiZXhwIjoyMDcwMTcwMjA1fQ.38OziF4QPRStGplNG-S3HytUIq7cW9Bozz32mejfxzM
NEXT_PUBLIC_PREVIEW_ADMIN=1
NEXT_PUBLIC_ADMIN_ALLOWLIST=client@example.com,admin@example.com
```

### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL
4. Redeploy if needed

### 4. Enable Preview Deployments

1. Go to Project Settings → Git
2. Enable "Preview Deployments" for pull requests
3. This allows testing changes before merging

## Post-Deployment Configuration

### Supabase URL Configuration

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to:
   - Site URL: `https://your-vercel-app.vercel.app`
   - Redirect URLs: `https://your-vercel-app.vercel.app/auth/callback`

### Custom Domain (Optional)

1. In Vercel Project Settings → Domains
2. Add your custom domain
3. Update environment variables with new domain
4. Update Supabase URL configuration

## Testing the Deployment

### Basic Functionality Test
1. Visit the deployed URL
2. Test signup flow (should receive email confirmation)
3. Test login flow
4. Test dashboard access
5. Test request creation
6. Test admin panel access

### Health Check
- Visit `/api/health` to verify API is working
- Should return JSON with status: "healthy"

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation

### Authentication Issues
- Verify Supabase environment variables
- Check Supabase URL configuration
- Ensure redirect URLs match exactly

### Database Connection Issues
- Test Supabase connection in local environment first
- Verify RLS policies allow read access
- Check service role key if admin features fail

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor page views and performance

### Error Tracking
- Check Vercel Function logs for API errors
- Monitor Supabase logs for database issues

## Security Notes

- Service role key is only used server-side
- Admin access is gated by email allowlist
- All admin features are read-only in preview mode
- RLS policies protect user data

## Client Access

Once deployed, share the URL with the client:
- Main URL: `https://your-vercel-app.vercel.app`
- Admin access: Available to allowlisted emails
- Test credentials: Can be provided separately

## Maintenance

### Database Reset
- Use Supabase dashboard to clear test data
- Or run SQL commands to truncate specific tables

### Updates
- Push to main branch for automatic deployment
- Use preview deployments for testing changes