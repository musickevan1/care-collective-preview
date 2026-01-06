'use client';

import { ReactElement, useState, useEffect } from 'react';
import { X, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  hasReceivedWelcomeClient,
  dismissWelcomeBannerClient,
  isWelcomeBannerDismissedClient,
  WELCOME_BOT_NAME,
} from '@/lib/messaging/welcome-bot';
import Link from 'next/link';

interface WelcomeBannerProps {
  className?: string;
  variant?: 'full' | 'compact';
}

/**
 * WelcomeBanner - Displays onboarding message for new messaging users
 * 
 * Replaces the complex multi-step tour with a simple, dismissible banner
 * that explains how the help offer flow works.
 * 
 * Features:
 * - Shows only for users who haven't received welcome
 * - Dismissible with clear call-to-action
 * - Links to browse help requests
 * - Remembers dismissal via localStorage
 * 
 * @component
 */
export function WelcomeBanner({ 
  className,
  variant = 'full' 
}: WelcomeBannerProps): ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check welcome status after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const shouldShow = !hasReceivedWelcomeClient() && !isWelcomeBannerDismissedClient();
    setIsVisible(shouldShow);
  }, []);

  const handleDismiss = () => {
    dismissWelcomeBannerClient();
    setIsVisible(false);
  };

  // Don't render during SSR or if not visible
  if (!mounted || !isVisible) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "bg-sage/10 border border-sage/30 rounded-lg p-4 mx-4 mb-4",
          className
        )}
        role="alert"
        aria-label="Welcome message"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <strong>New to messaging?</strong> Browse help requests and click &quot;Offer Help&quot; to start a conversation.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-sm hover:bg-sage/20 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <Card
      className={cn(
        "border-sage/30 bg-gradient-to-br from-sage/5 to-dusty-rose/5 mx-4 mb-4",
        className
      )}
      role="region"
      aria-label="Welcome to messaging"
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-sage" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{WELCOME_BOT_NAME}</h3>
              <p className="text-xs text-muted-foreground">Getting Started</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-sm hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>

        {/* Welcome message content */}
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Welcome to CARE Collective messaging! Here&apos;s how helping works:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">
                1
              </span>
              <p className="text-sm text-muted-foreground">
                Browse help requests and click <strong className="text-foreground">&quot;Offer Help&quot;</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">
                2
              </span>
              <p className="text-sm text-muted-foreground">
                Your offer appears in <strong className="text-foreground">&quot;Pending&quot;</strong> until accepted
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage/20 text-sage text-xs font-bold flex items-center justify-center">
                3
              </span>
              <p className="text-sm text-muted-foreground">
                Once accepted, you can <strong className="text-foreground">chat directly</strong>!
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tips:</strong> Be specific about how you can help, 
              respond promptly, and check back for new requests regularly.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              variant="sage"
              className="min-h-[44px] gap-2"
            >
              <Link href="/requests">
                Browse Requests
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="min-h-[44px]"
            >
              Got it!
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
