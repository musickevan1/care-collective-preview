/**
 * @fileoverview Loading UI for Browse Help Requests page
 * Displays while help requests data is being fetched from the server
 */

import { ReactElement } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSkeleton, LoadingSpinner } from '@/components/ui/loading';

export default function Loading(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <div className="animate-pulse bg-muted rounded h-8 w-48 mb-2" />
          <div className="animate-pulse bg-muted rounded h-4 w-64" />
        </div>
        <div className="animate-pulse bg-muted rounded h-10 w-32" />
      </div>

      {/* Filter Panel Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="animate-pulse bg-muted rounded h-10 w-full" />
            <div className="animate-pulse bg-muted rounded h-10 w-full" />
            <div className="animate-pulse bg-muted rounded h-10 w-full" />
            <div className="animate-pulse bg-muted rounded h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Loading Spinner with Message */}
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner
          size="lg"
          message="Loading help requests..."
          className="mb-8"
        />
      </div>

      {/* Help Request Cards Skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="card" />
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading help requests from your community. Please wait...
      </div>
    </div>
  );
}
