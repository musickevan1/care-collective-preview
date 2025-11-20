'use client';

import { ReactElement, useEffect, useState, useCallback } from 'react';
import { X, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODAL_STORAGE_KEY = 'beta_welcome_modal_shown';

interface BetaWelcomeModalProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BetaWelcomeModal({ forceOpen, onOpenChange }: BetaWelcomeModalProps): ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If forceOpen is true, open immediately
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check if modal has already been shown (ever)
    const hasBeenShown = localStorage.getItem(MODAL_STORAGE_KEY);

    if (!hasBeenShown) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Mark as shown permanently (only if not force-opened)
    if (!forceOpen) {
      localStorage.setItem(MODAL_STORAGE_KEY, 'true');
    }
    // Notify parent component if callback provided
    onOpenChange?.(false);
  }, [forceOpen, onOpenChange]);

  // ESC key handler for closing modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, handleClose]);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-primary max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with Close Button */}
        <div className="relative bg-primary text-white p-6 md:p-8 rounded-t-xl flex-shrink-0">
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, Beta Tester!</h1>
            <p className="text-lg md:text-xl font-semibold opacity-90">
              You&apos;re part of something special
            </p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-grow">
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
          <div className="grid gap-5 my-6">
            <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-lg border border-primary/20">
              <AlertCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-secondary mb-2">Report Bugs Easily</p>
                <p className="text-base text-gray-700 leading-relaxed">
                  Look for the <span className="font-bold text-primary">&quot;Report Bug&quot;</span> button
                  in the bottom-right corner - use it whenever something doesn&apos;t work right!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-sage/5 rounded-lg border border-sage/20">
              <MessageSquare className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-lg text-secondary mb-2">Test Key Features</p>
                <p className="text-base text-gray-700 leading-relaxed">
                  Focus on <span className="font-bold">help requests</span> and{' '}
                  <span className="font-bold">messaging</span> - create requests, offer help,
                  and chat with other testers!
                </p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Remember:</strong> Report anything confusing, test on mobile if possible,
              and be honest with your feedback - we want the real thing, good or bad!
            </p>
          </div>

        </div>

        {/* Footer - Fixed */}
        <div className="p-6 md:p-8 border-t flex-shrink-0 space-y-3">
          <Button
            onClick={handleClose}
            className="w-full text-lg font-bold py-6 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            Got it! Let&apos;s get started 🚀
          </Button>
          <p className="text-center text-sm text-gray-600">
            Need help? Check the beta tester guide or use the bug report button anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
