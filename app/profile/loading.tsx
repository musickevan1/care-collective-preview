/**
 * @fileoverview Loading UI for Profile page
 * Displays skeleton components while profile data is being fetched
 */

import { ReactElement } from 'react';
import {
  Skeleton,
  ProfileInfoSkeleton,
  ListSkeleton
} from '@/components/ui/skeleton';

export default function Loading(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>
            <div className="p-6 pt-0">
              <ProfileInfoSkeleton />
            </div>
          </div>

          {/* Request Stats Card Skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* My Requests Section Skeleton */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-36 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <div className="p-6 pt-0">
              <ListSkeleton items={4} hasAvatar={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Loading your profile information. Please wait...
      </div>
    </div>
  );
}
