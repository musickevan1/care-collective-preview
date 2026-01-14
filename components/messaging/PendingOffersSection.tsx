/**
 * @fileoverview Section component displaying all pending help offers
 * Shows list of offers that need requester approval
 */

import { ReactElement } from 'react';
import { PendingOfferCard } from './PendingOfferCard';
import { Mail } from 'lucide-react';

interface PendingOffer {
  id: string;
  initial_message: string;
  created_at: string;
  expires_at: string;
  requester_id: string;
  helper_id: string;
  helper_profile: {
    id: string;
    name: string;
    location: string;
  };
  requester_profile: {
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
  currentUserId: string;
  onAccept: (conversationId: string) => Promise<void>;
  onReject: (conversationId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PendingOffersSection({
  offers,
  currentUserId,
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
      <div className="text-center py-12 px-4">
        <Mail className="w-12 h-12 text-muted-foreground mb-3 opacity-50 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-secondary mb-2">
          No Pending Offers
        </h3>
        <div className="text-sm text-gray-600 max-w-md mx-auto space-y-2">
          <p>
            When you offer to help with a request, it will appear here until the person accepts it.
          </p>
          <p>
            Offers you&apos;ve received from others will also show here for you to review.
          </p>
        </div>
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
            currentUserId={currentUserId}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}
