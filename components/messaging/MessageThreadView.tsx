'use client'

import { ReactElement, useRef, useState, useEffect } from 'react'
import { MessageWithSender } from '@/lib/messaging/types'
import { VirtualizedMessageList } from './VirtualizedMessageList'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface MessageThreadViewProps {
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  userId: string
  onRetry?: () => void
  className?: string
}

/**
 * MessageThreadView - Displays messages with loading and error states
 *
 * Phase 2.2 Part 3 - Fixed scroll isolation and height calculation
 *
 * Features:
 * - VirtualizedMessageList for 1000+ message performance
 * - Correct height tracking with ResizeObserver on scroll container
 * - Uses clientHeight (available space) NOT contentRect.height (content size)
 * - Inner scroll container with overflow-y-auto for scroll isolation
 * - Date separators for message grouping
 * - Loading state with spinner
 * - Error state with retry button
 *
 * @component
 */
export function MessageThreadView({
  messages,
  loading,
  error,
  userId,
  onRetry,
  className
}: MessageThreadViewProps): ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(300)

  // Track available height for virtualized list
  useEffect(() => {
    if (!scrollContainerRef.current) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Use clientHeight (available viewport space)
        // NOT contentRect.height (which would be content size)
        const availableHeight = entry.target.clientHeight

        // Ensure minimum height to prevent collapsed state
        const calculatedHeight = Math.max(300, availableHeight)

        setListHeight(calculatedHeight)
      }
    })

    observer.observe(scrollContainerRef.current)

    // Set initial height immediately (prevents flash of wrong size)
    const initialHeight = scrollContainerRef.current.clientHeight
    if (initialHeight > 0) {
      setListHeight(Math.max(300, initialHeight))
    }

    return () => observer.disconnect()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className || ''}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading messages...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center p-4 ${className || ''}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Messages display with virtualization and scroll isolation
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
    >
      <VirtualizedMessageList
        messages={messages}
        currentUserId={userId}
        showDateSeparators={true}
        enableVirtualization={true}
        height={listHeight}
        itemHeight={80}
      />
    </div>
  )
}
