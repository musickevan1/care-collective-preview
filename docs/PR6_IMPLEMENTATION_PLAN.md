# PR #6 Service Worker Fix - Implementation Plan

**Date:** 2025-10-23
**PR:** https://github.com/musickevan1/care-collective-preview/pull/6
**Objective:** Fix critical issues in service worker cache implementation before merging

---

## Overview

This plan addresses 8 critical and high-priority issues identified in the PR review. The fixes ensure:
1. Service worker updates activate immediately
2. Poor connectivity users (rural Missouri) aren't negatively impacted
3. Service worker logic is properly tested
4. Users are notified of available updates

---

## Task 1: Add Service Worker Lifecycle Management

**Priority:** CRITICAL
**File:** `public/sw.js`
**Estimated Time:** 30 minutes

### Problem
Current implementation changes cache names but doesn't force activation. Users may keep old service workers active until all tabs close.

### Solution
Add proper install and activate event handlers with immediate activation.

### Implementation

**Add after line 8 in `public/sw.js`:**

```javascript
// Install event - cache core assets and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION)

  // Skip waiting to activate immediately
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets')
        return cache.addAll(CORE_ASSETS)
      })
      .catch((error) => {
        console.error('[SW] Failed to cache core assets:', error)
        // Don't fail installation if caching fails
      })
  )
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker version:', CACHE_VERSION)

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Keep only current version caches
              const isCareCacheCollection = cacheName.startsWith('care-collective-')
              const isCurrentVersion = cacheName === CACHE_NAME || cacheName === OFFLINE_CACHE
              return isCareCacheCollection && !isCurrentVersion
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      // Take control of all clients immediately
      clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated and controlling all clients')
    })
  )
})

// Message event - allow pages to trigger SW update check
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

### Testing
```bash
# 1. Open DevTools > Application > Service Workers
# 2. Deploy new version
# 3. Verify old SW is replaced immediately
# 4. Check console for cache cleanup logs
# 5. Verify "Update on reload" works
```

---

## Task 2: Add Network Timeout for Slow Connections

**Priority:** CRITICAL (Care Collective Mission)
**File:** `public/sw.js`
**Estimated Time:** 45 minutes

### Problem
Network-first strategy causes delays for rural users with poor connectivity. Help requests may take 30+ seconds to load on slow connections.

### Solution
Add 2-second timeout to network requests, fall back to cache if network is slow.

### Implementation

**Add helper function (after line 163):**

```javascript
/**
 * Fetch with timeout - critical for rural/slow connections
 * Falls back to cache if network takes too long
 * @param {Request} request - The request to fetch
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(request, timeout = 2000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      console.warn('[SW] Network request timed out after', timeout, 'ms')
      throw new Error('Network timeout')
    }
    throw error
  }
}
```

**Replace `handleNavigationRequest` function (around line 168):**

```javascript
/**
 * Handle navigation requests with network-first strategy
 * CRITICAL: Includes timeout for slow connections (rural Missouri users)
 * This ensures users always see the latest deployment
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first with 2-second timeout
    const networkResponse = await fetchWithTimeout(request, 2000)

    if (networkResponse.ok) {
      // Cache the response for offline access
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed/timed out, trying cache:', error.message)

    // Network failed or timed out, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] Serving from cache due to network issues')
      return cachedResponse
    }

    // No cache, serve fallback
    return caches.match('/') || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
```

### Testing
```bash
# Chrome DevTools > Network > Throttling > Slow 3G
# 1. Navigate to help requests page
# 2. Verify page loads within 2 seconds from cache
# 3. Clear cache and verify network timeout works
# 4. Check console for timeout messages
```

---

## Task 3: Implement Stale-While-Revalidate for Help Requests

**Priority:** HIGH (Performance + Freshness)
**File:** `public/sw.js`
**Estimated Time:** 30 minutes

### Problem
Network-first is slow; cache-first shows stale data. We need both speed AND freshness.

### Solution
Serve cached version immediately while fetching update in background.

### Implementation

**Replace `handleHelpRequestPage` function (around line 195):**

```javascript
/**
 * Handle help request pages with stale-while-revalidate
 * Serves cached version immediately while updating in background
 * BEST of both worlds: fast loading + fresh content
 */
async function handleHelpRequestPage(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  // Fetch fresh version in background
  const fetchPromise = fetchWithTimeout(request, 2000)
    .then((response) => {
      if (response.ok) {
        console.log('[SW] Updating help request page in cache')
        cache.put(request, response.clone())
      }
      return response
    })
    .catch((error) => {
      console.warn('[SW] Background fetch failed:', error.message)
      return null
    })

  // If we have cached version, return it immediately
  // Next visit will have the updated version
  if (cachedResponse) {
    console.log('[SW] Serving help request from cache, updating in background')
    return cachedResponse
  }

  // No cache, wait for network
  console.log('[SW] No cache for help request, waiting for network')
  const networkResponse = await fetchPromise
  return networkResponse || new Response('Unable to load help request', {
    status: 503,
    statusText: 'Service Unavailable'
  })
}
```

**Update fetch event listener to use this strategy (around line 95):**

```javascript
// Special handling for help request pages
if (url.pathname.startsWith('/requests/')) {
  event.respondWith(handleHelpRequestPage(request))
  return
}
```

### Testing
```bash
# 1. Visit /requests/[id] (loads from network)
# 2. Refresh page (instant load from cache)
# 3. Update request in database
# 4. Refresh again (old version shown, but updating in background)
# 5. Refresh once more (new version shown)
```

---

## Task 4: Add Service Worker Update Notification

**Priority:** HIGH (User Experience)
**Files:** `components/ServiceWorkerUpdate.tsx`, `app/layout.tsx`
**Estimated Time:** 45 minutes

### Problem
Users don't know when updates are available. For crisis situations, they need to know immediately.

### Solution
Create notification component that detects updates and prompts user to refresh.

### Implementation

**Create `components/ServiceWorkerUpdate.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ReactElement } from 'react'

/**
 * Service Worker Update Notification
 * Detects when a new version is available and prompts user to refresh
 * CRITICAL: Ensures users see latest features and fixes in crisis situations
 */
export default function ServiceWorkerUpdate(): ReactElement | null {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update()
        }, 60000)

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing

          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              console.log('[App] New version available')
              setUpdateAvailable(true)
            }
          })
        })

        return () => clearInterval(interval)
      })
      .catch((error) => {
        console.error('[App] Service worker registration failed:', error)
      })
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  if (!updateAvailable) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-sage p-4 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            Update Available
          </h3>
          <p className="mt-1 text-sm text-white/90">
            A new version of Care Collective is available. Refresh to get the latest features and fixes.
          </p>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="text-white/90 hover:text-white"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleUpdate}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sage hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sage min-h-[44px]"
        >
          Update Now
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-sage min-h-[44px]"
        >
          Later
        </button>
      </div>
    </div>
  )
}
```

**Update `app/layout.tsx` (add before closing body tag):**

```typescript
import ServiceWorkerUpdate from '@/components/ServiceWorkerUpdate'

// ... in RootLayout return statement:
<body className={overlock.className}>
  {children}
  <ServiceWorkerUpdate />
</body>
```

### Testing
```bash
# 1. Deploy version A
# 2. Load app in browser
# 3. Deploy version B
# 4. Wait 60 seconds (or trigger manual update check)
# 5. Verify notification appears
# 6. Click "Update Now" - page should reload with new version
```

---

## Task 5: Improve Script Validation

**Priority:** MEDIUM
**File:** `scripts/update-sw-version.js`
**Estimated Time:** 15 minutes

### Problem
Version regex is too loose and could match unintended strings.

### Solution
Use strict version format validation.

### Implementation

**Replace lines 11-21 in `scripts/update-sw-version.js`:**

```javascript
const swPath = path.join(__dirname, '../public/sw.js');
const timestamp = new Date().toISOString().slice(0, 10);
const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
const newVersion = `${timestamp}-${randomSuffix}`;

// Strict version format: YYYY-MM-DD-XXX
const versionRegex = /const CACHE_VERSION = '\d{4}-\d{2}-\d{2}-\d{3}'/;
const newVersionLine = `const CACHE_VERSION = '${newVersion}'`;

console.log(`📦 Updating service worker cache version...`);
console.log(`   Old pattern: const CACHE_VERSION = 'YYYY-MM-DD-XXX'`);
console.log(`   New version: ${newVersion}`);
```

**Replace error handling (lines 31-33):**

```javascript
} catch (error) {
  console.error('');
  console.error('❌ CRITICAL ERROR: Service worker version update failed!');
  console.error('   This will cause users to see stale cached content.');
  console.error('   Deployment should be aborted.');
  console.error('');
  console.error('   Error details:', error.message);
  console.error('   File path:', swPath);
  console.error('');
  process.exit(1);
}
```

---

## Task 6: Improve Static Asset Detection

**Priority:** MEDIUM
**File:** `public/sw.js`
**Estimated Time:** 10 minutes

### Problem
Current regex misses modern formats (webp, avif, wasm, etc.)

### Solution
Use comprehensive list of static asset extensions.

### Implementation

**Add constants after line 8:**

```javascript
// Static asset file extensions for cache-first strategy
// These files have content hashes, so cache-first is safe
const STATIC_ASSET_EXTENSIONS = /\.(js|css|woff2?|ttf|eot|otf|png|jpg|jpeg|gif|svg|ico|webp|avif|wasm|json|xml|txt)$/i;
const STATIC_ASSET_PATHS = [
  '/_next/static/',
  '/_next/image',
  '/fonts/',
  '/images/',
  '/icons/'
];
```

**Update fetch event listener (around line 97):**

```javascript
// Cache-first for static assets (JS, CSS, images, fonts)
// These have content hashes in filenames, so cache-first is safe
const isStaticAsset = STATIC_ASSET_PATHS.some(path => url.pathname.startsWith(path)) ||
                      STATIC_ASSET_EXTENSIONS.test(url.pathname);

if (isStaticAsset) {
  event.respondWith(handleStaticAsset(request))
  return
}
```

---

## Task 7: Add Service Worker Tests

**Priority:** CRITICAL
**Files:** `tests/e2e/service-worker.spec.ts`, `playwright.config.ts`
**Estimated Time:** 1.5 hours

### Problem
Service worker logic is untested. This is critical infrastructure for offline functionality.

### Solution
Add comprehensive E2E tests using Playwright.

### Implementation

**Create `tests/e2e/service-worker.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Service Worker', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant service worker permissions
    await context.grantPermissions(['service-worker'])
  })

  test('should register service worker successfully', async ({ page }) => {
    await page.goto('/')

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js')
        return !!registration
      }
      return false
    })

    expect(swRegistered).toBe(true)
  })

  test('should use network-first for HTML navigation', async ({ page }) => {
    await page.goto('/')

    // First load - should come from network
    const requests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/requests')) {
        requests.push(request.url())
      }
    })

    await page.goto('/requests')
    await page.waitForLoadState('networkidle')

    expect(requests.length).toBeGreaterThan(0)
  })

  test('should use cache-first for static assets', async ({ page }) => {
    await page.goto('/')

    // Track requests
    const staticRequests: Map<string, string> = new Map()

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/_next/static/')) {
        const fromCache = response.fromServiceWorker()
        staticRequests.set(url, fromCache ? 'cache' : 'network')
      }
    })

    // Load page twice
    await page.goto('/requests')
    await page.waitForLoadState('networkidle')
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Second load should serve static assets from cache
    const cachedAssets = Array.from(staticRequests.values()).filter(
      source => source === 'cache'
    )

    expect(cachedAssets.length).toBeGreaterThan(0)
  })

  test('should fall back to cache when offline', async ({ page, context }) => {
    // Load page while online
    await page.goto('/requests')
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)

    // Should still load from cache
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Check that page loaded (title should be visible)
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should timeout slow network requests', async ({ page }) => {
    // Throttle network to simulate slow connection
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 500, // 500 bytes/s - very slow
      uploadThroughput: 500,
      latency: 2000, // 2 second latency
    })

    // Visit page - should timeout and fall back to cache
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Should load quickly from cache (< 3 seconds)
    expect(loadTime).toBeLessThan(3000)
  })

  test('should clean up old caches on activation', async ({ page }) => {
    await page.goto('/')

    // Check cache cleanup
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys()
    })

    // Should only have current version caches
    const oldCaches = cacheNames.filter((name: string) =>
      name.startsWith('care-collective-') &&
      !name.includes('2025') // Adjust based on current version format
    )

    expect(oldCaches.length).toBe(0)
  })

  test('should handle help request pages with stale-while-revalidate', async ({ page }) => {
    // First visit - cache the page
    await page.goto('/requests/test-id')
    await page.waitForLoadState('networkidle')

    // Second visit - should load from cache immediately
    const startTime = Date.now()
    await page.goto('/requests/test-id')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    // Should load very quickly from cache (< 500ms)
    expect(loadTime).toBeLessThan(500)
  })
})

test.describe('Service Worker Update Notification', () => {
  test('should show update notification when new version available', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Simulate service worker update
    await page.evaluate(() => {
      // Trigger update found event
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const event = new Event('updatefound')
        navigator.serviceWorker.controller.dispatchEvent(event)
      }
    })

    // Wait for notification to appear
    const notification = page.locator('role=alert').filter({ hasText: 'Update Available' })
    await expect(notification).toBeVisible({ timeout: 5000 })
  })

  test('update notification should be accessible', async ({ page }) => {
    await page.goto('/')

    // Check for accessible notification when it appears
    const notification = page.locator('role=alert')

    if (await notification.isVisible()) {
      // Should have proper ARIA attributes
      await expect(notification).toHaveAttribute('aria-live', 'polite')

      // Buttons should have min 44px height
      const updateButton = notification.getByRole('button', { name: /update now/i })
      const bbox = await updateButton.boundingBox()
      expect(bbox?.height).toBeGreaterThanOrEqual(44)
    }
  })
})
```

**Update `playwright.config.ts` to include service worker tests:**

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Enable service workers in tests
    serviceWorkers: 'allow',
  },
  // ... rest of config
})
```

### Running Tests

```bash
# Run all service worker tests
npx playwright test service-worker

# Run with UI to debug
npx playwright test service-worker --ui

# Run in headed mode to see browser
npx playwright test service-worker --headed

# Generate test report
npx playwright test service-worker --reporter=html
```

---

## Task 8: Performance Testing & Documentation

**Priority:** HIGH
**Files:** `docs/PR6_PERFORMANCE_RESULTS.md`
**Estimated Time:** 1 hour

### Problem
No performance metrics to validate the network-first approach doesn't harm UX.

### Solution
Test on various connection speeds and document results.

### Implementation

**Create `docs/PR6_PERFORMANCE_RESULTS.md`:**

```markdown
# PR #6 Performance Testing Results

## Test Environment
- Date: [Fill in]
- Browser: Chrome 120
- Location: [Fill in]
- Codebase: PR #6 branch

## Test Methodology

### Connection Profiles Tested
1. **Fast 4G** (Good connectivity)
   - Download: 4 Mbps
   - Upload: 3 Mbps
   - Latency: 20ms

2. **Slow 3G** (Rural Missouri simulation)
   - Download: 400 Kbps
   - Upload: 400 Kbps
   - Latency: 400ms

3. **Offline** (No connectivity)

### Pages Tested
- `/` (Home page)
- `/requests` (Help requests listing)
- `/requests/[id]` (Help request detail)
- `/dashboard` (User dashboard)

## Results

### Fast 4G (Good Connectivity)

| Page | First Load | Second Load | Cache Hit | Notes |
|------|-----------|-------------|-----------|-------|
| Home | TBD | TBD | TBD | Network-first |
| Requests | TBD | TBD | TBD | Network-first |
| Request Detail | TBD | TBD | TBD | Stale-while-revalidate |
| Dashboard | TBD | TBD | TBD | Network-first |

### Slow 3G (Rural Missouri)

| Page | First Load | Second Load (Timeout) | From Cache | Notes |
|------|-----------|---------------------|------------|-------|
| Home | TBD | TBD | TBD | Should fall back to cache after 2s |
| Requests | TBD | TBD | TBD | Critical for urgent requests |
| Request Detail | TBD | TBD | TBD | Immediate from cache |
| Dashboard | TBD | TBD | TBD | User-specific data |

### Offline

| Page | Load Time | Success | Notes |
|------|-----------|---------|-------|
| Home | TBD | TBD | Should load from cache |
| Requests | TBD | TBD | Should show cached requests |
| Request Detail | TBD | TBD | Should show if previously visited |
| Dashboard | TBD | TBD | Should show cached data |

## Lighthouse Scores

### Before PR #6
- Performance: TBD
- Accessibility: TBD
- Best Practices: TBD
- SEO: TBD

### After PR #6
- Performance: TBD
- Accessibility: TBD
- Best Practices: TBD
- SEO: TBD

## Key Findings

### Positive Impacts
- [To be filled after testing]

### Negative Impacts
- [To be filled after testing]

### Recommendations
- [To be filled after testing]

## Testing Commands

### Chrome DevTools Throttling
```bash
# Open DevTools > Network tab
# Set throttling to "Slow 3G"
# Test all pages
# Document load times
```

### Lighthouse
```bash
# Desktop
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --view

# Mobile
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --preset=mobile --view
```

### Playwright Network Emulation
```bash
npx playwright test service-worker --headed
```
```

**Testing Checklist:**

```bash
# 1. Start local server
npm run dev

# 2. Test Fast 4G
# Chrome DevTools > Network > Fast 4G
# Navigate to each page, record times
# Use Performance tab to capture metrics

# 3. Test Slow 3G
# Chrome DevTools > Network > Slow 3G
# Navigate to each page
# Verify 2-second timeout kicks in
# Verify cache fallback works

# 4. Test Offline
# Chrome DevTools > Network > Offline
# Navigate to previously visited pages
# Verify content still loads

# 5. Run Lighthouse
npx lighthouse http://localhost:3000 --view
npx lighthouse http://localhost:3000/requests --view

# 6. Fill in results in docs/PR6_PERFORMANCE_RESULTS.md
```

---

## Final Checklist Before Merging

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passes with 0 warnings
- [ ] All new code follows CLAUDE.md guidelines
- [ ] File sizes under 500 lines
- [ ] Functions under 50 lines

### Testing
- [ ] All service worker tests pass
- [ ] Manual testing completed on:
  - [ ] Fast 4G
  - [ ] Slow 3G
  - [ ] Offline
- [ ] Accessibility tests pass
- [ ] Update notification works
- [ ] Test coverage ≥ 80%

### Performance
- [ ] Performance results documented
- [ ] Lighthouse scores acceptable (≥90 for accessibility)
- [ ] No performance regression on fast connections
- [ ] Slow connections handled gracefully (2s timeout)

### Documentation
- [ ] CLAUDE.md updated with new patterns
- [ ] PR6_PERFORMANCE_RESULTS.md filled in
- [ ] Code comments added for complex logic
- [ ] Service worker behavior documented

### Deployment
- [ ] Test on Vercel preview deployment
- [ ] Verify cache busting works in production
- [ ] Test service worker update flow
- [ ] Verify old caches are cleaned up
- [ ] Monitor for errors in production logs

### Care Collective Mission Alignment
- [ ] Rural users can access during slow connectivity
- [ ] Urgent help requests load quickly (stale-while-revalidate)
- [ ] Offline access preserved for crisis situations
- [ ] Update notifications don't interrupt urgent workflows
- [ ] Accessibility maintained (WCAG 2.1 AA)

---

## Deployment Steps

```bash
# 1. Create new branch for fixes
git checkout -b pr6-critical-fixes

# 2. Implement all 8 tasks above
# (Follow each task's implementation section)

# 3. Run tests
npm run type-check
npm run lint
npx playwright test service-worker
npm run test

# 4. Commit changes
git add .
git commit -m "fix: Add critical service worker lifecycle and performance fixes

- Add skipWaiting() and clients.claim() for immediate updates
- Add 2-second network timeout for slow connections
- Implement stale-while-revalidate for help requests
- Add user notification for available updates
- Improve static asset detection and cache cleanup
- Add comprehensive service worker tests
- Document performance results

Addresses PR #6 review feedback for Care Collective mission alignment.

🤖 Generated with Claude Code"

# 5. Push to PR branch
git push origin pr6-critical-fixes

# 6. Update PR #6 or create new PR with fixes
# Include performance results and test coverage

# 7. After review approval, merge and deploy
git checkout main
git merge pr6-critical-fixes
git push origin main
npx vercel --prod

# 8. Monitor production
npx vercel inspect <deployment-url> --logs
# Watch for service worker errors
# Verify cache cleanup occurs
# Check update notifications appear
```

---

## Estimated Total Time

| Task | Time | Priority |
|------|------|----------|
| 1. SW Lifecycle | 30 min | CRITICAL |
| 2. Network Timeout | 45 min | CRITICAL |
| 3. Stale-While-Revalidate | 30 min | HIGH |
| 4. Update Notification | 45 min | HIGH |
| 5. Script Validation | 15 min | MEDIUM |
| 6. Static Asset Detection | 10 min | MEDIUM |
| 7. SW Tests | 90 min | CRITICAL |
| 8. Performance Testing | 60 min | HIGH |
| **TOTAL** | **5 hours** | - |

---

## Success Criteria

1. **Service worker updates activate immediately** - No stale content
2. **Slow connections handled gracefully** - 2s timeout, cache fallback
3. **Help requests load instantly** - Stale-while-revalidate
4. **Users notified of updates** - Clear, accessible notification
5. **Tests provide confidence** - 80%+ coverage, all critical paths tested
6. **Performance documented** - Clear metrics for all connection types
7. **Care Collective mission upheld** - Rural users, crisis situations, accessibility

---

## Questions or Issues?

If you encounter any problems during implementation:

1. Check console logs in DevTools for service worker errors
2. Use Application tab > Service Workers to debug lifecycle
3. Test in incognito window to verify fresh service worker
4. Review Playwright test output for failures
5. Check network tab for timeout behavior

For Care Collective specific concerns:
- Ensure 44px minimum touch targets (Task 4)
- Verify WCAG 2.1 AA compliance (Task 4)
- Test on slow connections (Task 8)
- Consider urgent request scenarios (Task 3)

---

**Ready to start? Begin with Task 1 (SW Lifecycle) as it's the foundation for all other improvements.**
