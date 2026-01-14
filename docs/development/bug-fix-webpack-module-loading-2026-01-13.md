# Webpack Module Loading Error - Fixed January 13, 2026

## Problem

Production errors appearing in browser console:

```
[ErrorTracker] Error tracked: Cannot read properties of undefined (reading 'call')
TypeError: Cannot read properties of undefined (reading 'call')
    at h (webpack-a18d6c4e56493e23.js:1:541)
    at MessagePort.T (6999-57802b5142 1c39.js:1:105015)
```

### Root Cause

The VirtualizedMessageList component used a **named export** only:
```typescript
export function VirtualizedMessageList({ ... }) { ... }
```

But MessagingDynamic.tsx attempted to wrap it as a default export during lazy loading:
```typescript
const VirtualizedMessageList = lazy(() =>
  import('./VirtualizedMessageList').then(m => ({ default: m.VirtualizedMessageList }))
)
```

This pattern is fragile because:
1. If the module `m` loads incorrectly, `m.VirtualizedMessageList` is `undefined`
2. Webpack's internal `.call()` on undefined triggers the error
3. Production minification/tree-shaking can break the named export resolution
4. Creates unnecessary complexity in the module loading chain

## Solution

Added a **default export** to VirtualizedMessageList.tsx:

```typescript
export function VirtualizedMessageList({ ... }) { ... }

// Default export for dynamic imports to avoid module loading issues
export default VirtualizedMessageList;
```

Simplified the lazy import in MessagingDynamic.tsx:

```typescript
// Before (fragile)
const VirtualizedMessageList = lazy(() =>
  import('./VirtualizedMessageList').then(m => ({ default: m.VirtualizedMessageList }))
)

// After (robust)
const VirtualizedMessageList = lazy(() => import('./VirtualizedMessageList'))
```

## Why This Works

1. **Direct default export** - React.lazy expects `Promise<{ default: Component }>`, now provided directly
2. **Simpler module resolution** - No intermediate `.then()` transformation needed
3. **Better tree-shaking** - Webpack can optimize the import path
4. **Production-safe** - Minification doesn't break the export chain

## Testing

- ✅ Production build succeeds: `npm run build`
- ✅ TypeScript compilation clean: `npx tsc --noEmit`
- ✅ Both named and default exports available for flexibility

## Related Files

- `components/messaging/VirtualizedMessageList.tsx` - Added default export
- `components/messaging/MessagingDynamic.tsx` - Simplified lazy import

## Error Tracking Context

These errors were captured by the ErrorTracker system (introduced in Phase 3 - fc95f1a). The `[ErrorTracker]` prefix in console logs indicates the custom error tracking is working correctly and caught a real production issue.

## Recommendation for Other Components

Consider adding default exports to all components used with React.lazy:
- MessagingDashboard
- ConversationList
- MessageInput
- MessageBubble

This pattern is more robust and production-safe than the `.then(m => ({ default: m.ComponentName }))` transformation.

## References

- React.lazy documentation: https://react.dev/reference/react/lazy
- Error tracking setup: `lib/error-tracking.ts`
- Phase 3 infrastructure: commit fc95f1a
