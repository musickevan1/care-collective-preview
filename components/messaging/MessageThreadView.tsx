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
 * Phase 2.2 Part 2 - Now uses VirtualizedMessageList for performance
 *
 * Features:
 * - VirtualizedMessageList for 1000+ message performance
 * - Auto-height tracking with ResizeObserver
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  // Track container height for virtualization
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { height } = entry.contentRect
        // Ensure minimum height
        setContainerHeight(Math.max(300, height))
      }
    })

    observer.observe(containerRef.current)

    // Set initial height
    const rect = containerRef.current.getBoundingClientRect()
    setContainerHeight(Math.max(300, rect.height))

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

  // Messages display with virtualization
  return (
    <div ref={containerRef} className={`flex-1 flex flex-col min-h-0 ${className || ''}`}>
      <VirtualizedMessageList
        messages={messages}
        currentUserId={userId}
        showDateSeparators={true}
        enableVirtualization={true}
        height={containerHeight}
        itemHeight={80}
        className="flex-1"
      />
    </div>
  )
}
