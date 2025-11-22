'use client';

import { ReactElement } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConversationSkeletonProps {
  /**
   * Number of skeleton items to display
   * @default 3
   */
  count?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ConversationSkeleton Component
 *
 * Loading skeleton that matches the structure of ConversationItem
 * for better visual consistency during loading states.
 *
 * Displays placeholder shapes for:
 * - User icon and name
 * - Location
 * - Help request title
 * - Category badge
 * - Last message preview
 * - Timestamp
 * - Unread count badge
 *
 * @component
 */
export function ConversationSkeleton({
  count = 3,
  className
}: ConversationSkeletonProps): ReactElement {
  return (
    <div className={cn("space-y-1 p-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="p-4 animate-pulse"
          aria-hidden="true"
        >
          <div className="space-y-3">
            {/* Header: Participant info and unread badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                {/* User icon + name */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded-full flex-shrink-0" />
                  <div className="w-24 h-4 bg-muted rounded" />
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 ml-6">
                  <div className="w-3 h-3 bg-muted rounded-full" />
                  <div className="w-20 h-3 bg-muted rounded" />
                </div>
              </div>

              {/* Unread badge */}
              <div className="w-6 h-5 bg-muted rounded-full flex-shrink-0" />
            </div>

            {/* Help request section */}
            <div className="space-y-2 pt-2 border-t border-muted/20">
              {/* Request title */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded-full flex-shrink-0" />
                <div className="w-32 h-4 bg-muted rounded" />
              </div>

              {/* Category and status badges */}
              <div className="flex items-center gap-2 flex-wrap ml-6">
                <div className="w-16 h-5 bg-muted rounded-full" />
                <div className="w-12 h-5 bg-muted rounded-full" />
              </div>
            </div>

            {/* Last message preview */}
            <div className="flex items-start gap-2 pt-2 border-t border-muted/20">
              <div className="w-4 h-4 bg-muted rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="w-full h-3 bg-muted rounded" />
                <div className="w-3/4 h-3 bg-muted rounded" />
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-full" />
              <div className="w-16 h-3 bg-muted rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
