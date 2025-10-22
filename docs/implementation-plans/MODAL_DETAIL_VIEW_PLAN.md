# Modal Detail View Implementation Plan
**Solution for React Error #419 on /requests/[id] pages**

## Overview
Replace the broken `/requests/[id]` page with a modal overlay that opens from the `/requests` list page. This avoids the Next.js dynamic route SSR issue while providing better UX.

## Why This Solution?
✅ Works around the React Error #419 framework bug
✅ Better UX - users stay in context on the list page
✅ Faster - no page navigation needed
✅ Mobile-friendly - drawer on mobile, modal on desktop
✅ Already have working list page - just enhance it

## Technical Approach

### Architecture
```
/requests page (Server Component)
  ↓ passes data
RequestsList (Client Component)
  ↓ handles clicks
RequestDetailModal (Client Component)
  ↓ shows details + actions
  - RequestDetails
  - MessagingInterface
  - ContactExchange
  - StatusActions
```

### URL Strategy
- `/requests` - List view (default)
- `/requests?id=xxx` - List view with modal open
- Uses URL params for deep linking & browser back button support

## Implementation Steps

### Phase 1: Create Modal Component (30 min)
**File**: `components/help-requests/RequestDetailModal.tsx`

```typescript
'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRouter, useSearchParams } from 'next/navigation'

interface RequestDetailModalProps {
  request: HelpRequest
  currentUserId: string
  open: boolean
  onClose: () => void
}

export function RequestDetailModal({ request, currentUserId, open, onClose }: RequestDetailModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleClose = () => {
    // Clear URL param and close
    window.history.pushState({}, '', '/requests')
    onClose()
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <RequestDetailContent request={request} currentUserId={currentUserId} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[95vh]">
        <RequestDetailContent request={request} currentUserId={currentUserId} />
      </DrawerContent>
    </Drawer>
  )
}
```

### Phase 2: Extract Detail Content Component (20 min)
**File**: `components/help-requests/RequestDetailContent.tsx`

Move existing content from `app/requests/[id]/page.tsx` into reusable component:
- Request header (title, status, urgency)
- Full description
- Category badge
- Timeline
- Messaging integration
- Contact exchange (if applicable)
- Action buttons

### Phase 3: Update List Page to Handle Modals (20 min)
**File**: `app/requests/page.tsx`

```typescript
'use client'

export default function RequestsPage() {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Fetch full request details when ID in URL
  useEffect(() => {
    if (selectedId) {
      fetch(`/api/requests/${selectedId}`)
        .then(res => res.json())
        .then(setSelectedRequest)
    } else {
      setSelectedRequest(null)
    }
  }, [selectedId])

  return (
    <>
      <RequestsList
        requests={requests}
        onRequestClick={(id) => {
          router.push(`/requests?id=${id}`)
        }}
      />

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          currentUserId={user.id}
          open={!!selectedRequest}
          onClose={() => router.push('/requests')}
        />
      )}
    </>
  )
}
```

### Phase 4: Create API Endpoint for Detail Fetch (15 min)
**File**: `app/api/requests/[id]/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('help_requests')
    .select('*, profiles(id, name, location)')
    .eq('id', params.id)
    .single()

  if (error || !request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(request)
}
```

### Phase 5: Add useMediaQuery Hook (10 min)
**File**: `hooks/useMediaQuery.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
```

### Phase 6: Update Request Cards for Click Handling (10 min)
**File**: `components/help-requests/HelpRequestCard.tsx`

Add onClick handler:
```typescript
<Card
  className="cursor-pointer hover:shadow-md transition-shadow"
  onClick={() => onRequestClick?.(request.id)}
>
  {/* existing card content */}
</Card>
```

### Phase 7: Deprecate Old Route (5 min)
**File**: `app/requests/[id]/page.tsx`

Replace with redirect:
```typescript
export default function RequestDetailPage({ params }: { params: { id: string } }) {
  redirect(`/requests?id=${params.id}`)
}
```

## Files to Create
- [ ] `components/help-requests/RequestDetailModal.tsx`
- [ ] `components/help-requests/RequestDetailContent.tsx`
- [ ] `app/api/requests/[id]/route.ts`
- [ ] `hooks/useMediaQuery.ts`

## Files to Modify
- [ ] `app/requests/page.tsx` - Add modal state & handling
- [ ] `components/help-requests/HelpRequestCard.tsx` - Add click handler
- [ ] `app/requests/[id]/page.tsx` - Replace with redirect

## Testing Checklist

### Desktop (Browser >= 768px)
- [ ] Click request card opens modal
- [ ] Modal shows full request details
- [ ] Close button works
- [ ] ESC key closes modal
- [ ] Click outside closes modal
- [ ] Browser back button closes modal
- [ ] Direct link `/requests?id=xxx` opens with modal
- [ ] Messaging works in modal
- [ ] Contact exchange works in modal
- [ ] Status updates work in modal

### Mobile (Browser < 768px)
- [ ] Click request card opens drawer
- [ ] Drawer slides up from bottom
- [ ] Swipe down closes drawer
- [ ] All features work in drawer

### Accessibility
- [ ] Modal traps focus
- [ ] Screen reader announces modal open/close
- [ ] Keyboard navigation works
- [ ] ARIA labels present

### Performance
- [ ] Modal opens quickly (<200ms)
- [ ] No layout shift when opening
- [ ] Smooth animations
- [ ] No memory leaks (open/close 10x)

## Estimated Timeline
- **Phase 1**: 30 min - Modal component structure
- **Phase 2**: 20 min - Extract detail content
- **Phase 3**: 20 min - List page integration
- **Phase 4**: 15 min - API endpoint
- **Phase 5**: 10 min - useMediaQuery hook
- **Phase 6**: 10 min - Card click handlers
- **Phase 7**: 5 min - Deprecate old route
- **Testing**: 20 min - Comprehensive testing

**Total**: ~2 hours (could be faster if components already well-structured)

## Migration Strategy

### For Existing Users
1. Deploy modal solution
2. Keep redirect in `/requests/[id]` for backward compatibility
3. Update all internal links to use `?id=` pattern
4. Remove old route after 1-2 weeks

### For Thursday Demo
1. Complete Phases 1-4 minimum (core functionality)
2. Phase 5-6 are UX enhancements (nice to have)
3. Phase 7 can wait until after demo

## Rollback Plan
If modal solution has issues:
1. Revert to Option 1 (client-side fetch)
2. Or show limited info in modal, link to external page for full details

## Success Criteria
✅ No React Error #419
✅ Request details viewable
✅ Messaging works
✅ Contact exchange works
✅ Mobile + desktop responsive
✅ Accessible (WCAG 2.1 AA)
✅ Fast (<200ms to open)

## Notes
- Uses existing shadcn/ui Dialog and Drawer components
- Maintains URL state for deep linking
- Browser back button works naturally
- Better UX than traditional page navigation
- Avoids the Next.js dynamic route SSR bug entirely

---

**Status**: Ready for implementation
**Owner**: TBD
**Target**: Before Thursday demo
**Priority**: HIGH (blocks demo)
