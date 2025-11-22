'use client';

import { ReactElement, useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * LocalStorage key for tracking onboarding completion
 * Note: This is NOT sensitive information - just UI state tracking
 * CLAUDE.md allows non-sensitive localStorage usage
 */
const ONBOARDING_STORAGE_KEY = 'care-collective-messaging-tour-completed';

interface TourStep {
  title: string;
  description: string;
  /**
   * CSS selector for the element to highlight
   * If null, shows step without highlighting specific element
   */
  targetSelector: string | null;
  /**
   * Position of the tooltip relative to the highlighted element
   */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Messaging',
    description: 'This guided tour will help you understand how messaging works in Care Collective. You can skip it anytime.',
    targetSelector: null,
    position: 'center'
  },
  {
    title: 'Your Conversations',
    description: 'All your active conversations appear here. Click on any conversation to view and send messages.',
    targetSelector: '[data-tour="conversation-list"]',
    position: 'right'
  },
  {
    title: 'Message Thread',
    description: 'When you select a conversation, messages appear here. Scroll up to see older messages.',
    targetSelector: '[data-tour="message-thread"]',
    position: 'left'
  },
  {
    title: 'Send Messages',
    description: 'Type your message here and press Enter or click Send. Messages are sent in real-time.',
    targetSelector: '[data-tour="message-input"]',
    position: 'top'
  },
  {
    title: 'Need Help?',
    description: 'Look for help icons (?) throughout the interface for contextual assistance.',
    targetSelector: '[data-tour="help-tooltip"]',
    position: 'bottom'
  }
];

/**
 * MessagingOnboarding Component
 *
 * Provides a guided tour for first-time users to understand the messaging interface.
 * Features:
 * - Multi-step walkthrough with spotlight effect
 * - Keyboard navigation (Arrow keys, Escape)
 * - localStorage tracking to show only once
 * - WCAG 2.1 AA compliant
 * - Mobile-responsive
 *
 * @component
 */
export function MessagingOnboarding(): ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedRect, setHighlightedRect] = useState<DOMRect | null>(null);

  // Check if user has completed the tour
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompletedTour) {
      setIsVisible(true);
    }
  }, []);

  // Update highlighted element position when step changes
  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector) {
      setHighlightedRect(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightedRect(rect);
    }
  }, [currentStep, isVisible]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      aria-modal="true"
    >
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
        {highlightedRect && (
          <div
            className="absolute border-4 border-primary rounded-lg animate-pulse"
            style={{
              top: `${highlightedRect.top - 8}px`,
              left: `${highlightedRect.left - 8}px`,
              width: `${highlightedRect.width + 16}px`,
              height: `${highlightedRect.height + 16}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
          />
        )}
      </div>

      {/* Tour content card */}
      <div
        className={cn(
          "absolute bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4",
          step.position === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          step.position === 'top' && highlightedRect && "left-1/2 -translate-x-1/2",
          step.position === 'bottom' && highlightedRect && "left-1/2 -translate-x-1/2",
          step.position === 'left' && highlightedRect && "top-1/2 -translate-y-1/2",
          step.position === 'right' && highlightedRect && "top-1/2 -translate-y-1/2"
        )}
        style={
          highlightedRect
            ? {
                ...(step.position === 'top' && { top: `${highlightedRect.top - 200}px` }),
                ...(step.position === 'bottom' && { top: `${highlightedRect.bottom + 20}px` }),
                ...(step.position === 'left' && { left: `${highlightedRect.left - 400}px` }),
                ...(step.position === 'right' && { left: `${highlightedRect.right + 20}px` })
              }
            : undefined
        }
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h2 id="tour-title" className="text-lg font-semibold text-foreground">
              {step.title}
            </h2>
            <p id="tour-description" className="text-sm text-muted-foreground mt-2">
              {step.description}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2 justify-between">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="min-h-[44px]"
            >
              Skip Tour
            </Button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="sage"
                onClick={handleNext}
                className="min-h-[44px] gap-2"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          </div>

          {/* Keyboard hints */}
          <p className="text-xs text-muted-foreground text-center">
            Use arrow keys to navigate • Press Esc to skip
          </p>
        </div>
      </div>
    </div>
  );
}
