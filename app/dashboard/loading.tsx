/**
 * @fileoverview Loading UI for Dashboard page
 * Displays skeleton components while dashboard data is being fetched
 */

import { ReactElement } from 'react';
import {
  Skeleton,
  QuickActionSkeleton,
  StatsCardSkeleton,
  ListSkeleton
} from '@/components/ui/skeleton';

export default function Loading(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Recent Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* User's Activity */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="p-6 pt-0">
            <ListSkeleton items={3} hasAvatar={false} />
          </div>
        </div>

        {/* Recent Community Activity */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6 pt-0">
            <ListSkeleton items={3} hasAvatar={false} />
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading your dashboard. Please wait...
      </div>
    </div>
  );
}
