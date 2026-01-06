/**
 * @fileoverview Loading state for admin moderation page
 */

import { ReactElement } from 'react';

export default function ModerationLoading(): ReactElement {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg border bg-white border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-12 bg-gray-300 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Queue Skeleton */}
      <div className="p-6 bg-white rounded-lg border shadow-sm">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
