/**
 * @fileoverview Admin moderation interface for messaging system
 * Simplified version for build compatibility
 */

import { ReactElement } from 'react';
import { ModerationQueue } from '@/components/admin/ModerationQueue';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export default function ModerationPage(): ReactElement {
  const handleItemProcessed = () => {
    console.log('Moderation item processed');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messaging Moderation</h1>
        <p className="text-gray-600 mt-2">
          Review and moderate reported messages to maintain community safety.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Reports</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Conversations</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">This week</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-white border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Messages Today</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500 mt-1">Ready for implementation</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Safety Score</h3>
          <p className="text-2xl font-bold text-green-700">95%</p>
          <p className="text-xs text-gray-500 mt-1">Community safety</p>
        </div>
      </div>

      {/* Moderation Queue */}
      <ModerationQueue 
        items={[]}
        onItemProcessed={handleItemProcessed}
      />
    </div>
  );
}

export const metadata = {
  title: 'Messaging Moderation - Admin - Care Collective',
  description: 'Moderation interface for community messaging safety'
};