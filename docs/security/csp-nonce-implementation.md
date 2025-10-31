# CSP Nonce-Based Implementation Plan

**Date Created**: 2025-10-31
**Priority**: HIGH
**Status**: Planning Phase
**Target Completion**: Session 3 (Future)

---

## Executive Summary

This document outlines the implementation strategy for transitioning from `unsafe-inline` and `unsafe-eval` CSP directives to nonce-based Content Security Policy in the Care Collective platform. This change will significantly improve security by preventing XSS attacks while maintaining Next.js 14 and Tailwind CSS functionality.

**Current Risk**: `unsafe-inline` and `unsafe-eval` expose the application to Cross-Site Scripting (XSS) attacks by allowing arbitrary inline scripts to execute.

**Goal**: Implement nonce-based CSP that:
- Removes `unsafe-inline` and `unsafe-eval` directives
- Maintains Next.js 14 functionality
- Preserves Tailwind CSS styling
- Supports service workers and PWA features
- Does not break production builds

---

## Current State Analysis

### Current CSP Configuration
**File**: `lib/security/middleware.ts:10-11`

```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
```

**Issues**:
1. ❌ `unsafe-inline` allows any inline script/style to execute (XSS vulnerability)
2. ❌ `unsafe-eval` allows eval() and Function() constructor (code injection vulnerability)
3. ⚠️ Comments indicate these are "required for Next.js and Tailwind"

### Dependencies Affected
- **Next.js 14.2.32**: Requires inline scripts for hydration, HMR, and framework runtime
- **Tailwind CSS 4**: Uses inline styles during development
- **Service Worker** (`public/sw.js`): Needs worker-src directive (now re-enabled)
- **Vercel Analytics**: May inject inline scripts

---

## Implementation Strategy

### Phase 1: Research & Preparation (1 hour)

#### 1.1 Next.js 14 Nonce Support Research
- [ ] Review Next.js 14 CSP documentation: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- [ ] Identify all framework inline scripts that need nonces
- [ ] Test nonce injection methods in middleware
- [ ] Verify compatibility with App Router and Server Components

**Key Questions**:
- Does Next.js 14 automatically inject nonces into framework scripts?
- How do we pass nonces from middleware to page components?
- Are there any known issues with nonce-based CSP in Next.js 14?

#### 1.2 Tailwind CSS Compatibility
- [ ] Determine if Tailwind 4 generates inline styles in production
- [ ] Test if `style-src 'self'` is sufficient without `unsafe-inline`
- [ ] Check for any CSS-in-JS usage that requires inline styles
- [ ] Verify build output doesn't contain inline styles

**Expected Outcome**: Tailwind should only use external stylesheets in production builds.

#### 1.3 Third-Party Script Audit
- [ ] Identify all third-party scripts (Vercel Analytics, Supabase, etc.)
- [ ] Determine which scripts inject inline code
- [ ] Document allowlisted domains vs. scripts requiring nonces
- [ ] Test if third-party scripts work with strict CSP

**Inventory**:
```typescript
// Current allowed domains
'https://vercel.live'
'https://*.vercel.app'
'https://*.supabase.co'
'https://fonts.googleapis.com'
'https://fonts.gstatic.com'
```

---

### Phase 2: Implementation (2-3 hours)

#### 2.1 Generate Nonces in Middleware
**File**: Create `lib/security/csp-nonce.ts`

```typescript
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate a cryptographically secure nonce for CSP
 * @returns Base64-encoded nonce string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

/**
 * Inject CSP nonce into request headers
 * Next.js will automatically use this nonce for framework scripts
 */
export function injectNonce(request: NextRequest, response: NextResponse): string {
  const nonce = generateNonce()

  // Store nonce in response headers for Next.js to consume
  response.headers.set('x-nonce', nonce)

  return nonce
}
```

#### 2.2 Update Middleware to Use Nonces
**File**: `lib/security/middleware.ts`

```typescript
import { generateNonce } from './csp-nonce'

export function getCSPHeader(nonce: string): string {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://vercel.live https://*.vercel.app`, // Removed unsafe-inline, unsafe-eval
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`, // Removed unsafe-inline
    "img-src 'self' data: blob: https://*.supabase.co https://vercel.live",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "media-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ]

  return cspDirectives.join('; ')
}

export function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  // Content Security Policy with nonce
  response.headers.set('Content-Security-Policy', getCSPHeader(nonce))

  // ... rest of security headers

  return response
}
```

#### 2.3 Update Root Layout to Pass Nonce
**File**: `app/layout.tsx`

```typescript
import { headers } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || undefined

  return (
    <html lang="en">
      <head>
        {/* Next.js will automatically inject nonce into framework scripts */}
        <meta name="csp-nonce" content={nonce} />
      </head>
      <body>
        {children}
        {/* Pass nonce to any custom inline scripts via Script component */}
      </body>
    </html>
  )
}
```

#### 2.4 Update Custom Script Components
**Pattern**: Any component using inline scripts must receive nonce prop

```typescript
import Script from 'next/script'
import { headers } from 'next/headers'

export async function CustomAnalytics() {
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || undefined

  return (
    <Script
      id="custom-analytics"
      nonce={nonce}
      strategy="afterInteractive"
    >
      {`
        // Custom analytics code
        window.analytics = { track: function() {} };
      `}
    </Script>
  )
}
```

#### 2.5 Update Middleware Entry Point
**File**: `middleware.ts`

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-edge'
import { generateNonce } from '@/lib/security/csp-nonce'
import { addSecurityHeaders } from '@/lib/security/middleware'
import { Logger } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  Logger.getInstance().debug('[Middleware] ENTRY POINT', {
    path: request.nextUrl.pathname,
    category: 'middleware'
  })

  try {
    // Generate nonce for this request
    const nonce = generateNonce()

    // Update session (authentication)
    const response = await updateSession(request)

    // Inject nonce into response headers
    response.headers.set('x-nonce', nonce)

    // Add security headers with nonce-based CSP
    addSecurityHeaders(response, nonce)

    Logger.getInstance().debug('[Middleware] EXIT - Returning response', {
      path: request.nextUrl.pathname,
      hasNonce: true,
      category: 'middleware'
    })

    return response
  } catch (error) {
    Logger.getInstance().error('[Middleware] CRITICAL ERROR', error as Error, {
      path: request.nextUrl.pathname,
      category: 'middleware',
      severity: 'critical'
    })

    // Security: In production, block all requests if middleware fails
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'system_error')
      return NextResponse.redirect(redirectUrl)
    }

    // Development: Allow through with warning
    Logger.getInstance().warn('[Middleware] Development mode - allowing request despite error', {
      path: request.nextUrl.pathname,
      category: 'middleware'
    })

    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### Phase 3: Testing & Validation (1-2 hours)

#### 3.1 Development Testing
- [ ] Run `npm run dev` with nonce-based CSP
- [ ] Verify all pages load without CSP violations
- [ ] Check browser console for CSP errors
- [ ] Test Hot Module Replacement (HMR) works
- [ ] Verify Tailwind styles apply correctly

**Test Checklist**:
```bash
# Start development server
npm run dev

# Open browser DevTools Console
# Navigate to: http://localhost:3000
# Check for CSP violation errors

# Test pages:
✓ Dashboard (/dashboard)
✓ Help Requests (/requests)
✓ Messaging (/messages)
✓ Admin Panel (/admin)
✓ Auth Pages (/login, /register)
```

#### 3.2 Production Build Testing
- [ ] Run `npm run build` to generate production build
- [ ] Check build output for inline scripts/styles
- [ ] Run production server locally: `npm run start`
- [ ] Test all critical user flows work
- [ ] Verify service worker registration succeeds

**Production Test Checklist**:
```bash
# Build production bundle
npm run build

# Check build output
ls -la .next/static/chunks/
# Should see NO inline scripts in HTML

# Start production server
npm run start

# Test in browser with strict CSP
# Navigate to: http://localhost:3000
# Monitor browser console for violations
```

#### 3.3 Browser Compatibility Testing
Test in multiple browsers to ensure CSP nonce support:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Expected Results**: All browsers support nonce-based CSP (CSP Level 2+).

#### 3.4 Third-Party Script Testing
- [ ] Verify Vercel Analytics works with nonce CSP
- [ ] Test Supabase client-side SDK initialization
- [ ] Check service worker registration (`public/sw.js`)
- [ ] Validate error tracking (if using Sentry/similar)

---

### Phase 4: Deployment & Monitoring (30 minutes)

#### 4.1 Gradual Rollout Strategy
**Recommended Approach**: Feature flag for gradual enablement

```typescript
// lib/features.ts
export const FEATURE_FLAGS = {
  ENABLE_NONCE_CSP: process.env.NEXT_PUBLIC_ENABLE_NONCE_CSP === 'true',
  // ... other flags
}
```

**Rollout Stages**:
1. **Stage 1**: Deploy to preview environment, test for 24 hours
2. **Stage 2**: Enable for internal users (10% traffic)
3. **Stage 3**: Roll out to 50% of users
4. **Stage 4**: Enable for 100% of users

#### 4.2 Monitoring & Alerts
Set up monitoring for CSP violations:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy-Report-Only"
          content={`${getCSPHeader(nonce)}; report-uri /api/csp-violation-report`}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Create violation report endpoint:
**File**: `app/api/csp-violation-report/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const violation = await request.json()

    Logger.getInstance().warn('CSP Violation Detected', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      category: 'security',
      severity: 'medium'
    })

    // Send to external monitoring service if configured
    if (process.env.ENABLE_ERROR_TRACKING) {
      // await errorTracker.captureCSPViolation(violation)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    Logger.getInstance().error('Failed to process CSP violation report', error as Error)
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 })
  }
}
```

#### 4.3 Rollback Plan
If nonce-based CSP causes issues in production:

**Immediate Rollback**:
1. Set `NEXT_PUBLIC_ENABLE_NONCE_CSP=false`
2. Redeploy with `npx vercel --prod`
3. Revert to previous CSP configuration with `unsafe-inline`

**Code Rollback**:
```bash
git revert <csp-nonce-commit-sha>
git push origin main
npx vercel --prod
```

---

## Files to Modify

### New Files (2)
1. `lib/security/csp-nonce.ts` - Nonce generation utilities
2. `app/api/csp-violation-report/route.ts` - CSP violation reporting endpoint

### Modified Files (4)
3. `lib/security/middleware.ts` - Update CSP headers to use nonces
4. `middleware.ts` - Generate and inject nonces
5. `app/layout.tsx` - Pass nonce to framework
6. `.env.example` - Add feature flag documentation

### Files to Audit (TBD)
- Any components using `<Script>` with inline code
- Custom inline styles (should be minimal/none)
- Third-party script integrations

---

## Known Challenges & Solutions

### Challenge 1: Next.js HMR (Hot Module Replacement)
**Issue**: Development HMR may inject inline scripts without nonces
**Solution**: Next.js 14+ automatically injects nonces for framework scripts when `x-nonce` header is present

### Challenge 2: Tailwind JIT Mode
**Issue**: Tailwind may generate inline styles during development
**Solution**: Tailwind 4 should only use external stylesheets in production; test thoroughly

### Challenge 3: Service Worker Registration
**Issue**: Service worker registration script may be inline
**Solution**: Move registration to external file or use nonce in Script component

### Challenge 4: Vercel Analytics
**Issue**: Vercel may inject inline analytics scripts
**Solution**: Check if Vercel supports nonce-based CSP; may need to allowlist specific hashes

---

## Success Criteria

### Security
✅ No `unsafe-inline` or `unsafe-eval` in CSP headers
✅ All inline scripts use nonces
✅ CSP violation reports show zero violations in production
✅ XSS attack surface significantly reduced

### Functionality
✅ All pages load without errors
✅ Development HMR works correctly
✅ Production builds succeed
✅ Service worker registers successfully
✅ Third-party scripts function properly

### Performance
✅ No measurable performance degradation
✅ Page load times remain consistent
✅ No increase in bundle size

---

## Timeline & Effort

**Phase 1 (Research)**: 1 hour
**Phase 2 (Implementation)**: 2-3 hours
**Phase 3 (Testing)**: 1-2 hours
**Phase 4 (Deployment)**: 30 minutes

**Total Effort**: 4.5-6.5 hours
**Recommended Schedule**: Implement over 2-3 sessions with thorough testing between each phase

---

## Next Steps

1. **Before Starting Implementation**:
   - Review Next.js 14 CSP documentation thoroughly
   - Test nonce injection in a minimal Next.js 14 app
   - Verify Tailwind 4 doesn't generate inline styles in production

2. **During Implementation**:
   - Start with `report-only` CSP mode to catch violations without blocking
   - Test each phase in isolation before moving forward
   - Document any unexpected issues or workarounds

3. **After Implementation**:
   - Monitor CSP violation reports for 48 hours
   - Gather user feedback on any functional issues
   - Update this document with lessons learned

---

## References

- [Next.js 14 Content Security Policy Documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [MDN CSP Nonce Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#nonce-source)
- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Author**: Claude Code Security Audit
**Status**: Ready for Implementation (Session 3)
