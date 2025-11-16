/**
 * @fileoverview Request Detail Modal Component
 * Responsive modal that displays request details
 * - Desktop: Dialog (center overlay)
 * - Mobile: Drawer (bottom sheet)
 * Handles URL state for deep linking and browser back button
 */

'use client'

import { ReactElement } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { RequestDetailContent } from './RequestDetailContent'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RequestDetailModalProps {
  request: any // Full request object with profiles
  currentUserId: string
  open: boolean
  onClose: () => void
  helpRequestMessagingStatus?: {
    conversationCount: number
    unreadCount: number
    hasActiveConversations: boolean
  }
}

export function RequestDetailModal({
  request,
  currentUserId,
  open,
  onClose,
  helpRequestMessagingStatus
}: RequestDetailModalProps): ReactElement {
  // Use 768px as breakpoint (matches Tailwind's md breakpoint)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleClose = () => {
    // Clear URL param when closing
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/requests')
    }
    onClose()
  }

  // Desktop: Dialog Modal
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 border-b bg-background flex-shrink-0">
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0">
            <RequestDetailContent
              request={request}
              currentUserId={currentUserId}
              helpRequestMessagingStatus={helpRequestMessagingStatus}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Drawer (Bottom Sheet)
  return (
    <Drawer open={open} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header with close button for mobile */}
        <div className="bg-background border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
          <RequestDetailContent
            request={request}
            currentUserId={currentUserId}
            helpRequestMessagingStatus={helpRequestMessagingStatus}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

