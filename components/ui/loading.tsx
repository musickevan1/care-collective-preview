/**
 * @fileoverview Unified Loading Components
 * 
 * Addresses Issue #6 from TESTING_ISSUES_AND_FIXES.md - Loading State Inconsistencies
 * Provides consistent loading indicators and skeleton patterns across the application
 */

'use client'

import { ReactElement } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  className?: string
}

/**
 * Consistent loading spinner with accessibility support
 */
export function LoadingSpinner({ 
  size = 'md', 
  message,
  className 
}: LoadingSpinnerProps): ReactElement {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }
  
  return (
    <div 
      role="status" 
      aria-live="polite" 
      className={cn('flex flex-col items-center justify-center', className)}
    >
      <Loader2 
        className={cn(
          'animate-spin text-primary', 
          sizes[size]
        )} 
        aria-hidden="true"
      />
      {message && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
      <span className="sr-only">
        {message || 'Loading...'}
      </span>
    </div>
  )
}

/**
 * Inline loading spinner for buttons and small spaces
 */
interface InlineLoadingProps {
  className?: string
}

export function InlineLoading({ className }: InlineLoadingProps): ReactElement {
  return (
    <Loader2 
      className={cn('h-4 w-4 animate-spin', className)}
      aria-hidden="true"
    />
  )
}

/**
 * Loading skeleton patterns for different content types
 */
interface LoadingSkeletonProps {
  type: 'card' | 'form' | 'list' | 'text' | 'avatar' | 'button'
  lines?: number
  className?: string
}

export function LoadingSkeleton({ 
  type, 
  lines = 3,
  className 
}: LoadingSkeletonProps): ReactElement {
  const baseClasses = 'animate-pulse bg-muted rounded'
  
  const skeletonPatterns = {
    card: (
      <div className={cn('p-4 border rounded-lg space-y-3', className)}>
        <div className={cn(baseClasses, 'h-4 w-3/4')} />
        <div className={cn(baseClasses, 'h-3 w-full')} />
        <div className={cn(baseClasses, 'h-3 w-2/3')} />
        <div className="flex gap-2 pt-2">
          <div className={cn(baseClasses, 'h-8 w-16')} />
          <div className={cn(baseClasses, 'h-8 w-20')} />
        </div>
      </div>
    ),
    
    form: (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={cn(baseClasses, 'h-4 w-24')} />
            <div className={cn(baseClasses, 'h-10 w-full')} />
          </div>
        ))}
        <div className="flex gap-2 pt-4">
          <div className={cn(baseClasses, 'h-10 w-24')} />
          <div className={cn(baseClasses, 'h-10 w-20')} />
        </div>
      </div>
    ),
    
    list: (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(baseClasses, 'h-10 w-10 rounded-full')} />
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, 'h-4 w-3/4')} />
              <div className={cn(baseClasses, 'h-3 w-1/2')} />
            </div>
          </div>
        ))}
      </div>
    ),
    
    text: (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              baseClasses, 
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    ),
    
    avatar: (
      <div className={cn(baseClasses, 'h-10 w-10 rounded-full', className)} />
    ),
    
    button: (
      <div className={cn(baseClasses, 'h-10 w-24', className)} />
    ),
  }
  
  return (
    <div role="status" aria-label="Loading content">
      {skeletonPatterns[type]}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Full page loading screen
 */
interface FullPageLoadingProps {
  message?: string
  className?: string
}

export function FullPageLoading({ 
  message = 'Loading...',
  className 
}: FullPageLoadingProps): ReactElement {
  return (
    <div 
      className={cn(
        'min-h-screen flex items-center justify-center bg-background',
        className
      )}
    >
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Please wait while we load your content
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading overlay for existing content
 */
interface LoadingOverlayProps {
  visible: boolean
  message?: string
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({ 
  visible, 
  message,
  children,
  className 
}: LoadingOverlayProps): ReactElement {
  return (
    <div className={cn('relative', className)}>
      {children}
      {visible && (
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          aria-hidden={!visible}
        >
          <div className="bg-card p-6 rounded-lg border shadow-lg">
            <LoadingSpinner size="lg" message={message} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Loading states for specific Care Collective contexts
 */
export function LoadingHelpRequests(): ReactElement {
  return (
    <div className="space-y-4">
      <LoadingSkeleton type="card" />
      <LoadingSkeleton type="card" />
      <LoadingSkeleton type="card" />
    </div>
  )
}

export function LoadingContactExchange(): ReactElement {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <LoadingSkeleton type="avatar" />
        <div className="space-y-1 flex-1">
          <div className="animate-pulse bg-muted rounded h-4 w-32" />
          <div className="animate-pulse bg-muted rounded h-3 w-24" />
        </div>
      </div>
      <LoadingSkeleton type="text" lines={2} />
      <div className="mt-4">
        <LoadingSkeleton type="button" />
      </div>
    </div>
  )
}

export function LoadingProfile(): ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LoadingSkeleton type="avatar" className="h-16 w-16" />
        <div className="space-y-2">
          <div className="animate-pulse bg-muted rounded h-6 w-32" />
          <div className="animate-pulse bg-muted rounded h-4 w-24" />
        </div>
      </div>
      <LoadingSkeleton type="form" lines={4} />
    </div>
  )
}