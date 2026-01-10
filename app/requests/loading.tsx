/**
 * @fileoverview Loading UI for Browse Help Requests page
 * Displays skeleton components while help requests data is being fetched
 */

import { ReactElement } from 'react';
import {
  Skeleton,
  PageHeaderSkeleton,
  CardSkeleton
} from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

export default function Loading(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton hasSubtitle={false} hasAction={true} />

      {/* Filter Panel Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
        <CardSkeleton hasAvatar={true} hasDescription={true} hasFooter={true} />
        <CardSkeleton hasAvatar={true} hasDescription={true} hasFooter={true} />
        <CardSkeleton hasAvatar={true} hasDescription={true} hasFooter={true} />
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading help requests from your community. Please wait...
      </div>
    </div>
  );
}
