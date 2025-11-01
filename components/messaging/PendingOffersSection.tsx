/**
 * @fileoverview Section component displaying all pending help offers
 * Shows list of offers that need requester approval
 */

import { ReactElement } from 'react';
import { PendingOfferCard } from './PendingOfferCard';
import { Inbox } from 'lucide-react';

interface PendingOffer {
  id: string;
  initial_message: string;
  created_at: string;
  expires_at: string;
  helper_profile: {
    id: string;
    name: string;
    location: string;
  };
  help_request: {
    id: string;
    title: string;
    category: string;
    urgency: string;
  };
}

interface PendingOffersSectionProps {
  offers: PendingOffer[];
  onAccept: (conversationId: string) => Promise<void>;
  onReject: (conversationId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PendingOffersSection({
  offers,
  onAccept,
  onReject,
  isLoading = false
}: PendingOffersSectionProps): ReactElement {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin"
             role="status"
             aria-label="Loading pending offers" />
        <p className="mt-4 text-gray-600">Loading pending offers...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="w-16 h-16 mx-auto text-gray-300 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-secondary mb-2">
          No Pending Offers
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          When community members offer to help with your requests, they'll appear here for you to review
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-secondary">
          Pending Offers ({offers.length})
        </h3>
        <p className="text-sm text-gray-600">
          Review offers from community members who want to help
        </p>
      </div>

      <div className="space-y-3">
        {offers.map(offer => (
          <PendingOfferCard
            key={offer.id}
            offer={offer}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}
