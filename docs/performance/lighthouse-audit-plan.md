# Lighthouse Audit Plan - Sprint D

**Production URL**: https://swmocarecollective.org
**Date**: January 2026
**Status**: Ready for manual audit

## Pages to Audit

### Priority 1: Core User Flows
1. **Landing Page** (`/`)
   - First impression, SEO critical
   - Expected: Performance 90+, Accessibility 95+

2. **Dashboard** (`/dashboard`)
   - Main authenticated experience
   - Expected: Performance 85+, Accessibility 95+

3. **Help Requests** (`/requests`)
   - Core feature page
   - Expected: Performance 85+, Accessibility 95+

4. **New Request** (`/requests/new`)
   - Largest client-side bundle (45KB)
   - Expected: Performance 80+, Accessibility 95+

### Priority 2: Auth & Messaging
5. **Login** (`/login`)
6. **Signup** (`/signup`)
7. **Messages** (`/messages`)

## How to Run Lighthouse Audit

### Option 1: Chrome DevTools
1. Open Chrome and navigate to each URL
2. Open DevTools (F12)
3. Go to Lighthouse tab
4. Select: Performance, Accessibility, Best Practices, SEO
5. Choose: Mobile device simulation
6. Click "Analyze page load"
7. Save report as HTML/JSON

### Option 2: Lighthouse CLI
```bash
npm install -g lighthouse
lighthouse https://swmocarecollective.org --output html --output-path ./reports/homepage.html
```

## Metrics to Capture

| Metric | Target | Description |
|--------|--------|-------------|
| Performance | 80+ | Overall performance score |
| Accessibility | 95+ | WCAG compliance |
| Best Practices | 90+ | Security, modern standards |
| SEO | 90+ | Search optimization |
| LCP | <2.5s | Largest Contentful Paint |
| FID | <100ms | First Input Delay |
| CLS | <0.1 | Cumulative Layout Shift |

## Results Template

### Page: [URL]
- **Performance**: XX
- **Accessibility**: XX
- **Best Practices**: XX
- **SEO**: XX
- **LCP**: X.Xs
- **FID**: XXms
- **CLS**: X.XX

**Issues Found**:
- [ ] Issue 1
- [ ] Issue 2

**Recommendations**:
- Recommendation 1
- Recommendation 2

---

## Notes

- Run audits in Incognito mode to avoid extension interference
- Test both mobile and desktop
- Run multiple times and average results
- Save all reports for comparison

## Related Tasks
- Bundle size analysis: Complete (159KB first load)
- Image optimization: Enabled (was disabled)
- Database queries: Pending optimization
