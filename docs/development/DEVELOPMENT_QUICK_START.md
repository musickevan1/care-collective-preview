# Development Quick Start Guide

## Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Supabase environment variables configured (`.env.local`)

## Getting Started

### Standard Development (For most features)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**IMPORTANT: Middleware Edge Runtime Issue**

If you see `ReferenceError: exports is not defined` when accessing protected routes, use the production build workaround:

```bash
# Use production build in development
npm run build
npx next start
```

**Why?**
- Next.js 14 middleware always runs in Edge Runtime
- Edge Runtime bundler has issues with CommonJS modules in development
- Production build handles this correctly
- Same environment as production deployment

**Impact:**
- ✅ Works: All authentication, authorization, protected routes
- ⚠️  Trade-off: Requires rebuild after code changes
- 📝  Recommendation: Use for auth/protected route development

### When to use which mode?

| Scenario | Command | Notes |
|-----------|----------|--------|
| **UI development** (pages, components) | `npm run dev` | Faster HMR, no rebuilds needed |
| **Auth/Protected routes** | `npm run build && npx next start` | Required for middleware testing |
| **Production testing** | `npm run build && npx next start` | Matches production exactly |
| **API routes** | `npm run dev` | API routes use Node.js runtime |

## Development Workflow

### Recommended Approach

1. **UI Development Phase**
   ```bash
   npm run dev
   ```
   - Build components, pages, styling
   - Use public routes for testing
   - Hot module reload works perfectly

2. **Auth/Protected Routes Phase**
   ```bash
   npm run build
   npx next start
   ```
   - Test authentication flows
   - Verify protected route access
   - Test authorization checks
   - After code changes: rebuild required

3. **Final Testing**
   ```bash
   npm run build
   npx start
   ```
   - Test complete application
   - Verify all user flows
   - Production-like environment

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

See `docs/development/ENVIRONMENT_SETUP_GUIDE.md` for complete setup.

## Common Issues

### Middleware Edge Runtime Error

**Error:** `ReferenceError: exports is not defined`

**Solution:** Use production build:
```bash
npm run build
npx next start
```

**Documentation:** See `docs/development/MIDDLEWARE_FIX_INVESTIGATION_RESULTS.md`

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill existing process
pkill -f "next dev"
pkill -f "next start"

# Or use different port
PORT=3001 npm run dev
```

### Cache Issues

**Symptom:** Old code still runs after changes

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules (if needed)
rm -rf node_modules && npm install
```

## Development Scripts

Available npm scripts:

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm start           # Start production server

# Type checking
npm run type-check   # TypeScript type checking

# Testing
npm test            # Run tests
npm run test:coverage  # Test with coverage

# Database
npm run db:start     # Start local Supabase
npm run db:reset     # Reset database

# Linting
npm run lint        # ESLint
```

## Development Tips

### Hot Module Reload (HMR)

- Works with `npm run dev`
- Styles: Instant updates
- Components: Updates on save
- **Middleware:** Requires rebuild (use production build)

### Debugging

```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check console for middleware logs
# Look for: [Middleware] prefix
```

### Database Changes

1. Create migration in `supabase/migrations/`
2. Apply migration: `supabase db push`
3. Regenerate types: `npm run db:types`
4. Update `lib/database.types.ts`

### Testing Changes

```bash
# Run specific test suite
npm test -- messaging

# Watch mode for development
npm test -- --watch
```

## Performance

- **Dev server startup:** ~1.5s
- **Production build:** ~2-3 minutes
- **Hot reload:** <1s (UI changes)
- **Full rebuild:** ~2-3 minutes (production mode)

## Troubleshooting

### Issues not covered here?

1. Check `docs/development/` for specialized guides
2. Review investigation documents in `docs/archive/`
3. Check recent commits in Git history
4. Review `PROJECT_STATUS.md` for known issues

### Getting Help

- **Documentation:** See `docs/README.md` for complete index
- **Known Issues:** Check `PROJECT_STATUS.md`
- **Investigation docs:** Check `docs/archive/` folder

---

**Last Updated:** December 27, 2025
**Related:** `docs/development/MIDDLEWARE_FIX_INVESTIGATION_RESULTS.md`
