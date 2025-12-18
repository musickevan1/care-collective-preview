# Deployment Guide

This guide covers deployment procedures for Care Collective.

## Automatic Deployment

Care Collective uses Vercel with Git integration. **Every push to `main` automatically deploys to production.**

```bash
# Standard deployment workflow
git add .
git commit -m "feat: description"
git push origin main

# Monitor deployment at:
# https://vercel.com/musickevan1s-projects/care-collective-preview
```

## Important: Do NOT run `npx vercel --prod` manually
This causes duplicate deployments. Git push handles everything automatically.

## Pre-Deployment Checklist

```bash
# 1. Run type check
npm run type-check

# 2. Run linter
npm run lint

# 3. Run tests
npm run test

# 4. Build locally to verify
npm run build
```

## TODO: Sections to Complete

- [ ] Environment variable management
- [ ] Database migration procedures
- [ ] Rollback procedures
- [ ] Monitoring and alerts
- [ ] Performance verification post-deploy
- [ ] Service worker cache considerations

## Production URLs

- **Production**: https://care-collective-preview.vercel.app
- **Vercel Dashboard**: https://vercel.com/musickevan1s-projects/care-collective-preview

## Related Documentation

- [RLS Fix Deployment Guide](/docs/development/RLS_FIX_DEPLOYMENT_GUIDE.md)
- [Vercel KV Setup Guide](/docs/development/vercel-kv-setup-guide.md)

---
*Last updated: December 2025*
