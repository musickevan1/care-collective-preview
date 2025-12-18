# Debugging Guide

This guide covers common debugging scenarios and troubleshooting techniques for Care Collective.

## Common Issues

### Authentication Issues

```bash
# Check Supabase connection
npm run db:status

# View auth logs
npx supabase logs --project-ref YOUR_PROJECT_REF
```

### Database Issues

```bash
# Reset local database
npm run db:reset

# Check migrations
npm run db:migrations:list
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Type check
npm run type-check

# Lint check
npm run lint
```

## TODO: Sections to Complete

- [ ] Debugging React hydration errors
- [ ] Supabase RLS policy debugging
- [ ] Real-time subscription issues
- [ ] Authentication flow debugging
- [ ] Performance profiling
- [ ] Mobile-specific debugging

## Debugging Tools

- React DevTools
- Supabase Dashboard
- Chrome DevTools Network tab
- VS Code debugger configuration

## Related Documentation

- [Error Handling Guide](/docs/development/ERROR_HANDLING_GUIDE.md)
- [Testing Guide](/docs/guides/testing.md)

---
*Last updated: December 2025*
