/**
 * @fileoverview Enhanced HelpRequestCard with integrated messaging functionality
 * Allows users to offer help through secure messaging system
 */

'use client';

import { ReactElement, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  MapPin,
  Clock,
  AlertCircle,
  User,
  Heart,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ClientOnly';

interface HelpRequest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  exchange_offer?: string;
  profiles: {
    id: string;
    name: string;
    location?: string;
  };
}

interface HelpRequestCardWithMessagingProps {
  request: HelpRequest;
  currentUserId?: string;
  onConversationStarted?: (conversationId: string) => void;
}

export function HelpRequestCardWithMessaging({
  request,
  currentUserId,
  onConversationStarted
}: HelpRequestCardWithMessagingProps): ReactElement {
  const router = useRouter();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOwnRequest = currentUserId === request.user_id;

  // Urgency styling configuration
  const urgencyConfig = {
    normal: {
      badge: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      border: 'border-green-200'
    },
    urgent: {
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock,
      border: 'border-yellow-200'
    },
    critical: {
      badge: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
      border: 'border-red-200'
    }
  };

  const statusConfig = {
    open: { color: 'bg-green-100 text-green-700', label: 'Open' },
    in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed' }
  };

  const urgency = urgencyConfig[request.urgency];
  const status = statusConfig[request.status];
  const UrgencyIcon = urgency.icon;

  const handleOfferHelp = async () => {
    if (isOwnRequest) {
      setError('You cannot offer help on your own request');
      return;
    }

    if (request.status !== 'open') {
      setError(`This request is ${request.status} and no longer accepting offers`);
      return;
    }

    if (!currentUserId) {
      // Redirect to login/signup
      window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setShowOfferDialog(true);
    setOfferMessage('Hi! I\'d like to help with your request. When would be a good time to coordinate?');
  };

  const handleSubmitOffer = async () => {
    if (!offerMessage.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/messaging/help-requests/${request.id}/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: request.user_id,
          initial_message: offerMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();

      // API now returns simplified response with conversation_id
      if (!data.success || !data.conversation_id) {
        throw new Error('Failed to create conversation');
      }

      setSuccess(true);

      // Notify parent component
      onConversationStarted?.(data.conversation_id);

      // Auto-navigate to messages after showing success (no prompt needed - success message already tells them)
      setTimeout(() => {
        router.push(`/messages?conversation=${data.conversation_id}`);
      }, 2500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to offer help');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          urgency.border,
          request.urgency === 'critical' && 'ring-1 ring-red-200'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-secondary leading-tight mb-2">
                {request.title}
              </h3>
              <div className="flex items-center flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className={cn('text-xs font-medium', status.color)}
                >
                  {status.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn('text-xs font-medium flex items-center gap-1', urgency.badge)}
                >
                  <UrgencyIcon className="w-3 h-3" />
                  {request.urgency}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20">
                  {request.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          {request.description && (
            <p className="text-gray-600 mb-4 leading-relaxed">
              {request.description}
            </p>
          )}

          {/* Exchange Offer - Mutual Aid Indicator */}
          {request.exchange_offer && (
            <div className="mb-4 p-3 bg-sage/5 border border-sage/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-sage-dark mb-1">In exchange, I can offer:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {request.exchange_offer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Critical Request Alert */}
          {request.urgency === 'critical' && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                <strong>Critical request:</strong> This person needs urgent assistance. 
                If this is an emergency, please also contact local emergency services.
              </AlertDescription>
            </Alert>
          )}

          {/* Requester Info and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={request.profiles.name}
                size="md"
                className="bg-dusty-rose text-white flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-secondary">
                  {request.profiles.name}
                  {isOwnRequest && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                </p>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {request.profiles.location && (
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{request.profiles.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <time dateTime={request.created_at} title={new Date(request.created_at).toLocaleString()}>
                      <ClientOnly>
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </ClientOnly>
                    </time>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
              {!isOwnRequest && request.status === 'open' ? (
                <Button
                  onClick={handleOfferHelp}
                  className="bg-sage hover:bg-sage-dark text-white flex items-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Heart className="w-4 h-4" />
                  Offer Help
                </Button>
              ) : isOwnRequest ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/messages?help_request=${request.id}`)}
                  className="flex items-center gap-2 border-sage/30 text-sage hover:bg-sage/5 w-full sm:w-auto"
                >
                  <MessageCircle className="w-4 h-4" />
                  View Messages
                </Button>
              ) : (
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offer Help Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Conversation Started
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 text-sage" />
                  Offer Help
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {success ? (
                <>
                  <span className="text-green-600 font-medium">✓ Your offer has been sent!</span>
                  <br />
                  {request.profiles.name} has been notified. You can now start messaging to coordinate help.
                </>
              ) : (
                <>
                  Send a message to {request.profiles.name} to offer your help.{' '}
                  <strong className="text-secondary">You&apos;ll be able to message once you send your offer.</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!success ? (
            <div className="space-y-4">
              {/* Request Summary */}
              <div className="p-3 bg-sage-light/10 rounded-lg border border-sage-light/20">
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-sage mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-secondary">{request.title}</p>
                    <p className="text-xs text-muted-foreground">{request.profiles.name} • {request.category}</p>
                  </div>
                </div>
                {request.urgency !== 'normal' && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs flex items-center gap-1 w-fit', urgency.badge)}
                  >
                    <UrgencyIcon className="w-3 h-3" />
                    {request.urgency} priority
                  </Badge>
                )}
              </div>

              {/* Message Composition */}
              <div className="space-y-2">
                <Label htmlFor="offer-message" className="text-lg font-medium">Your message</Label>
                <Textarea
                  id="offer-message"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Hi. I think I can help! I am available most days after 5 PM"
                  className="resize-none text-lg"
                  rows={4}
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Be specific about how you can help</span>
                  <span>{offerMessage.length}/1000</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Safety Notice */}
              <Alert>
                <User className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  <strong>Safety reminder:</strong> All conversations are monitored for community safety. 
                  Meet in public places and trust your instincts.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-secondary mb-2">
                Offer Sent Successfully!
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Opening your conversation with {request.profiles.name}...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Redirecting to messages</span>
              </div>
            </div>
          )}

          {!success && (
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOfferDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOffer}
                disabled={!offerMessage.trim() || submitting}
                className="bg-sage hover:bg-sage-dark text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending offer...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Offer
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}