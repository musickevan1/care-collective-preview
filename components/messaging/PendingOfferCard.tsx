/**
 * @fileoverview Card component for displaying a single pending help offer
 * Shows helper info, initial message, help request context, and accept/reject actions
 * WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
 */

import { ReactElement, useState } from 'react';
import { Check, X, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface PendingOfferCardProps {
  offer: PendingOffer;
  currentUserId: string;
  onAccept: (conversationId: string) => Promise<void>;
  onReject: (conversationId: string) => Promise<void>;
}

export function PendingOfferCard({
  offer,
  currentUserId,
  onAccept,
  onReject
}: PendingOfferCardProps): ReactElement {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Determine if current user is the helper (sent offer) or requester (received offer)
  const isHelper = currentUserId === offer.helper_id;
  const isRequester = currentUserId === offer.requester_id;

  // Select the appropriate participant to display
  const displayParticipant = isHelper ? offer.requester_profile : offer.helper_profile;
  const participantRole = isHelper ? 'requester' : 'helper';

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(offer.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(offer.id);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <article
      className="border border-gray-200 rounded-lg p-4 space-y-4 hover:border-sage transition-colors"
      aria-label={isHelper
        ? `Your offer to ${displayParticipant.name} for ${offer.help_request.title}`
        : `Offer from ${displayParticipant.name} for ${offer.help_request.title}`}
    >
      {/* Participant Info */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full bg-sage text-white flex items-center justify-center font-semibold text-lg flex-shrink-0"
          aria-hidden="true"
        >
          {displayParticipant.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-secondary truncate">
            {displayParticipant.name}
            {isHelper && <span className="ml-2 text-xs font-normal text-gray-500">(awaiting response)</span>}
          </h4>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{displayParticipant.location}</span>
          </div>
        </div>
      </div>

      {/* Initial Message */}
      <div className="bg-cream p-3 rounded-lg border-l-4 border-sage">
        <p className="text-sm text-secondary whitespace-pre-wrap break-words">
          {offer.initial_message}
        </p>
      </div>

      {/* Help Request Context */}
      <div className="space-y-1 text-sm">
        <p className="text-gray-600">
          For: <strong className="text-secondary">{offer.help_request.title}</strong>
        </p>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>Sent {formatRelativeTime(offer.created_at)}</span>
        </div>
      </div>

      {/* Action Buttons or Status */}
      {isRequester ? (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
            className="flex-1 bg-sage hover:bg-sage-dark text-white font-medium py-2 px-4 rounded-lg
                       flex items-center justify-center gap-2 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2
                       min-h-[44px]"
            aria-label={`Accept offer from ${displayParticipant.name}`}
          >
            <Check className="w-5 h-5" aria-hidden="true" />
            {isAccepting ? 'Accepting...' : 'Accept Offer'}
          </button>
          <button
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-secondary font-medium py-2 px-4 rounded-lg
                       flex items-center justify-center gap-2 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                       min-h-[44px]"
            aria-label={`Decline offer from ${displayParticipant.name}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
            {isRejecting ? 'Declining...' : 'Decline'}
          </button>
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center py-2">
            <Clock className="w-4 h-4 inline-block mr-1" aria-hidden="true" />
            Waiting for {displayParticipant.name} to respond
          </p>
        </div>
      )}
    </article>
  );
}
