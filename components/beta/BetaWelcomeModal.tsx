'use client';

import { ReactElement, useEffect, useState } from 'react';
import { X, Bug, CheckCircle2, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODAL_SESSION_KEY = 'beta_welcome_modal_shown';

export function BetaWelcomeModal(): ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if modal has already been shown this session
    const hasBeenShown = sessionStorage.getItem(MODAL_SESSION_KEY);

    if (!hasBeenShown) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as shown for this session
    sessionStorage.setItem(MODAL_SESSION_KEY, 'true');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full border-4 border-primary">
        {/* Header with Close Button */}
        <div className="relative bg-primary text-white p-8 rounded-t-xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close welcome message"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Welcome, Beta Tester!</h1>
            <p className="text-xl font-semibold opacity-90">
              You're part of something special
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Main Message */}
          <div className="text-center mb-6">
            <p className="text-xl font-bold text-secondary leading-relaxed">
              Thank you for helping us build Care Collective!
            </p>
            <p className="text-lg text-gray-700 mt-3 font-medium">
              Your feedback over the next <span className="font-bold text-primary">2 weeks</span> will
              directly shape how this platform serves our community.
            </p>
          </div>

          {/* Key Points */}
          <div className="grid gap-4 my-6">
            <div className="flex items-start gap-4 p-4 bg-sage/10 rounded-lg border border-sage/30">
              <Bug className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-secondary mb-1">Report Bugs Easily</p>
                <p className="text-base text-gray-700 font-medium">
                  Look for the <span className="font-bold text-primary">"Report Bug"</span> button
                  in the bottom-right corner - use it whenever something doesn't work right!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-dusty-rose/10 rounded-lg border border-dusty-rose/30">
              <MessageSquare className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-secondary mb-1">Test Key Features</p>
                <p className="text-base text-gray-700 font-medium">
                  Focus on <span className="font-bold">help requests</span> and{' '}
                  <span className="font-bold">messaging</span> - create requests, offer help,
                  and chat with other testers!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
              <Users className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-secondary mb-1">Share Your Thoughts</p>
                <p className="text-base text-gray-700 font-medium">
                  You'll receive <span className="font-bold">2 short surveys</span>:
                  mid-week and final. Your honest feedback helps us improve!
                </p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-5 mt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-base text-gray-900 mb-1">Remember:</p>
                <ul className="text-sm text-gray-800 space-y-1 font-medium">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><span className="font-bold">No silly questions</span> - report anything confusing!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><span className="font-bold">Test on mobile</span> if you can - it's important!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><span className="font-bold">Be honest</span> - we want the real feedback, good or bad!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="pt-4">
            <Button
              onClick={handleClose}
              className="w-full text-lg font-bold py-6 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              Got it! Let's get started 🚀
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-600 pt-2">
            Need help? Check the beta tester guide or use the bug report button anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
