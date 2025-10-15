# Vercel KV Setup Guide - Care Collective

**Phase 3.2 Enhancement**: Distributed rate limiting with Redis-backed storage

## 📋 Overview

Care Collective uses Vercel KV (Redis) for production-ready distributed rate limiting across all Edge Function instances. This ensures rate limits are enforced consistently even when the application scales horizontally.

## 🎯 Benefits

- **Distributed**: Rate limits shared across all Vercel Edge Function instances
- **Persistent**: Survives deployments and instance restarts
- **Fast**: Sub-millisecond Redis operations
- **Automatic Scaling**: Managed by Vercel infrastructure
- **Graceful Fallback**: Development mode uses in-memory storage

## 🚀 Setup Instructions

### Step 1: Create Vercel KV Store

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your Care Collective project
3. Navigate to **Storage** tab
4. Click **Create Database** → **KV** (Redis)
5. Name it: `care-collective-rate-limiter`
6. Select region: Choose closest to your primary users (US East for Missouri)
7. Click **Create**

### Step 2: Connect KV to Your Project

Vercel automatically creates these environment variables:

```bash
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your_token_here
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
```

These are automatically available in:
- ✅ Production deployments
- ✅ Preview deployments
- ✅ Development (via `vercel env pull`)

### Step 3: Pull Environment Variables Locally (Optional)

For local testing with real KV:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project (one-time setup)
vercel link

# Pull environment variables
vercel env pull .env.local
```

**Note**: For local development, you can skip this step. The rate limiter will automatically fall back to in-memory storage.

### Step 4: Verify Configuration

Check that your rate limiter is using KV in production:

```bash
# Deploy to preview
vercel

# Check logs for:
# "[Rate Limiter] Using Vercel KV for distributed rate limiting"
#
# NOT:
# "[Rate Limiter] KV_REST_API_URL not found. Falling back to in-memory storage."
```

## 🧪 Testing Rate Limiting

### Local Testing (In-Memory)

```bash
npm run dev

# Rate limiter will log:
# "[Rate Limiter] Using in-memory fallback (development mode)"
```

### Production Testing (Vercel KV)

```bash
# Deploy to preview
vercel

# Test rate limiting endpoint (example)
curl -X POST https://your-preview.vercel.app/api/test-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Send multiple requests quickly to trigger rate limit
for i in {1..15}; do curl -X POST https://your-preview.vercel.app/api/test-endpoint; done

# Should see 429 response after exceeding limit
```

## 📊 Monitoring KV Usage

### Vercel Dashboard

1. Go to **Storage** → Your KV database
2. View metrics:
   - **Operations/sec**: Current request rate
   - **Storage used**: Total keys stored
   - **Bandwidth**: Data transfer

### Rate Limit Status API

Check current rate limit status programmatically:

```typescript
import { contactExchangeRateLimiter } from '@/lib/security/rate-limiter'

// Get status for a specific key
const status = await contactExchangeRateLimiter.getStatus('user:123')
console.log('Current count:', status?.count)
console.log('Resets at:', new Date(status?.resetTime || 0))

// Reset rate limit for testing
await contactExchangeRateLimiter.reset('user:123')
```

## 🔧 Rate Limiter Configuration

### Current Rate Limits

From `lib/security/rate-limiter.ts`:

```typescript
// Authentication attempts
authRateLimiter: 5 per 15 minutes

// General API requests
apiRateLimiter: 60 per minute

// Form submissions
formRateLimiter: 10 per minute

// Strict operations
strictRateLimiter: 5 per minute

// === Care Collective Specific ===

// Contact exchanges (privacy-sensitive)
contactExchangeRateLimiter: 5 per hour

// Help request creation
helpRequestRateLimiter: 10 per hour

// Messaging
messageRateLimiter: 10 per minute

// Content reports
reportRateLimiter: 5 per hour

// Admin actions
adminActionRateLimiter: 30 per minute
```

### Customizing Rate Limits

Edit limits in `lib/security/rate-limiter.ts`:

```typescript
export const customRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // 20 requests max
  message: 'Custom rate limit exceeded',
})
```

## 🚨 Troubleshooting

### Issue: "KV_REST_API_URL not found" in Production

**Solution**:
1. Verify KV database is connected to project in Vercel dashboard
2. Check **Settings** → **Environment Variables**
3. Ensure variables are set for **Production** environment
4. Redeploy: `vercel --prod`

### Issue: Rate Limits Not Syncing Across Instances

**Symptoms**: Different rate limit counts from different regions

**Solution**:
1. Verify KV is using correct region (check dashboard)
2. Check KV operations metrics for errors
3. Ensure `KV_REST_API_URL` points to KV instance (not placeholder)

### Issue: High KV Operation Costs

**If you see unexpectedly high KV usage**:

1. **Check for rate limit abuse**: Review rate limit logs
2. **Optimize cleanup**: KV uses TTL, no manual cleanup needed
3. **Adjust limits**: If legitimate traffic, increase rate limits

## 💰 Pricing Considerations

### Vercel KV Pricing (as of 2025)

- **Hobby Plan**:
  - 100K operations/month free
  - $0.20 per 100K ops after

- **Pro Plan**:
  - 500K operations/month included
  - $0.15 per 100K ops after

### Estimated Usage for Care Collective

**Beta Launch (20-30 active users)**:
- ~5K operations/day
- ~150K operations/month
- **Cost**: $0 (within free tier)

**Full Launch (100-200 users)**:
- ~20K operations/day
- ~600K operations/month
- **Cost**: ~$0.15-0.30/month (Pro plan)

## 📚 Additional Resources

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Rate Limiting Best Practices](https://vercel.com/guides/rate-limiting)
- [Care Collective Rate Limiter Source](../../lib/security/rate-limiter.ts)

## ✅ Deployment Checklist

Before deploying rate limiter to production:

- [x] Vercel KV database created
- [x] Environment variables configured
- [x] Rate limits tested in preview deployment
- [x] Monitoring dashboard reviewed
- [ ] Production deployment with `vercel --prod`
- [ ] Post-deployment smoke test of rate limits
- [ ] Monitor KV operations for first 24 hours

---

**Last Updated**: September 29, 2025 (Phase 3.2)
**Status**: Production Ready ✅
**Deployed**: Waiting for production KV configuration