/**
 * @fileoverview Enhanced loading skeleton components for Care Collective
 * Extends the existing loading system with specific patterns for help requests
 */

import { ReactElement } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  'aria-label'?: string;
}

export function HelpRequestDetailSkeleton({ 
  className, 
  'aria-label': ariaLabel = 'Loading help request details' 
}: LoadingSkeletonProps): ReactElement {
  return (
    <div className={cn('container mx-auto px-4 py-8 space-y-6', className)} role="status" aria-label={ariaLabel}>
      {/* Breadcrumb skeleton */}
      <div className="animate-pulse bg-muted rounded h-4 w-48" />

      {/* Main help request card skeleton */}
      <LoadingSkeleton type="card" className="mb-6" />

      {/* Additional details card skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <div className="animate-pulse bg-muted rounded h-6 w-40" />
        </CardHeader>
        <CardContent>
          <LoadingSkeleton type="form" lines={3} />
        </CardContent>
      </Card>

      {/* Communication card skeleton */}
      <Card>
        <CardHeader>
          <div className="animate-pulse bg-muted rounded h-6 w-32 mb-2" />
          <div className="animate-pulse bg-muted rounded h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="animate-pulse bg-muted rounded h-5 w-48" />
              <div className="animate-pulse bg-muted rounded h-4 w-32" />
            </div>
            <div className="animate-pulse bg-muted rounded h-9 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading help request details, please wait...
      </div>
    </div>
  );
}

export function HelpRequestCardSkeleton({ 
  className,
  'aria-label': ariaLabel = 'Loading help request'
}: LoadingSkeletonProps): ReactElement {
  return (
    <div className={cn(className)} role="status" aria-label={ariaLabel}>
      <LoadingSkeleton type="card" />
    </div>
  );
}

export function MessageListSkeleton({ 
  className,
  'aria-label': ariaLabel = 'Loading messages'
}: LoadingSkeletonProps): ReactElement {
  return (
    <div className={cn(className)} role="status" aria-label={ariaLabel}>
      <LoadingSkeleton type="list" lines={5} />
    </div>
  );
}

export function DashboardStatsSkeleton({ 
  className,
  'aria-label': ariaLabel = 'Loading dashboard statistics'
}: LoadingSkeletonProps): ReactElement {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)} role="status" aria-label={ariaLabel}>
      <LoadingSkeleton type="card" />
      <LoadingSkeleton type="card" />
      <LoadingSkeleton type="card" />
    </div>
  );
}