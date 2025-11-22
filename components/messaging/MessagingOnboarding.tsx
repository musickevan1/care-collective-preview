'use client';

import { ReactElement, useState, useEffect, useCallback } from 'react';
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
   * Preferred position of the tooltip relative to the highlighted element
   * Will auto-adjust if tooltip would go off-screen
   */
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Messaging',
    description: 'This guided tour will help you understand how messaging works in Care Collective. You can skip it anytime.',
    targetSelector: null,
    preferredPosition: 'center'
  },
  {
    title: 'Your Conversations',
    description: 'All your active conversations appear here. Click on any conversation to view and send messages.',
    targetSelector: '[data-tour="conversation-list"]',
    preferredPosition: 'right'
  },
  {
    title: 'Message Thread',
    description: 'When you select a conversation, messages appear here. Scroll up to see older messages.',
    targetSelector: '[data-tour="message-thread"]',
    preferredPosition: 'bottom'
  },
  {
    title: 'Send Messages',
    description: 'Type your message here and press Enter or click Send. Messages are sent in real-time.',
    targetSelector: '[data-tour="message-input"]',
    preferredPosition: 'top'
  },
  {
    title: 'Need Help?',
    description: 'Look for help icons (?) throughout the interface for contextual assistance.',
    targetSelector: '[data-tour="help-tooltip"]',
    preferredPosition: 'bottom'
  }
];

const TOOLTIP_PADDING = 20; // Gap between tooltip and highlighted element
const VIEWPORT_PADDING = 16; // Minimum distance from screen edges

interface TooltipPosition {
  top: number;
  left: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

/**
 * Calculates the optimal position for the tooltip based on viewport constraints
 */
function calculateTooltipPosition(
  highlightedRect: DOMRect | null,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center',
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  if (!highlightedRect || preferredPosition === 'center') {
    // Center of viewport
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2,
      position: 'center'
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Try preferred position first
  let position = preferredPosition;
  let top = 0;
  let left = 0;

  // Calculate position based on preferred placement
  switch (preferredPosition) {
    case 'top':
      top = highlightedRect.top - tooltipHeight - TOOLTIP_PADDING;
      left = highlightedRect.left + (highlightedRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'bottom':
      top = highlightedRect.bottom + TOOLTIP_PADDING;
      left = highlightedRect.left + (highlightedRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'left':
      top = highlightedRect.top + (highlightedRect.height / 2) - (tooltipHeight / 2);
      left = highlightedRect.left - tooltipWidth - TOOLTIP_PADDING;
      break;
    case 'right':
      top = highlightedRect.top + (highlightedRect.height / 2) - (tooltipHeight / 2);
      left = highlightedRect.right + TOOLTIP_PADDING;
      break;
  }

  // Check if tooltip would go off-screen and adjust
  // Check horizontal bounds
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  } else if (left + tooltipWidth > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - tooltipWidth - VIEWPORT_PADDING;
  }

  // Check vertical bounds and flip position if needed
  if (top < VIEWPORT_PADDING) {
    // Too high, try bottom instead
    if (preferredPosition === 'top') {
      position = 'bottom';
      top = highlightedRect.bottom + TOOLTIP_PADDING;
    } else {
      top = VIEWPORT_PADDING;
    }
  } else if (top + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
    // Too low, try top instead
    if (preferredPosition === 'bottom') {
      position = 'top';
      top = highlightedRect.top - tooltipHeight - TOOLTIP_PADDING;
    } else {
      top = viewportHeight - tooltipHeight - VIEWPORT_PADDING;
    }
  }

  // Final boundary clamp
  top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_PADDING));
  left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - tooltipWidth - VIEWPORT_PADDING));

  return { top, left, position };
}

/**
 * MessagingOnboarding Component
 *
 * Provides a guided tour for first-time users to understand the messaging interface.
 * Features:
 * - Multi-step walkthrough with spotlight effect
 * - Keyboard navigation (Arrow keys, Escape)
 * - localStorage tracking to show only once
 * - WCAG 2.1 AA compliant
 * - Fully responsive across all viewport sizes
 * - Auto-adjusts position to stay on screen
 *
 * @component
 */
export function MessagingOnboarding(): ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedRect, setHighlightedRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  // Check if user has completed the tour
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  // Update highlighted element position and calculate tooltip position
  const updatePositions = useCallback(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector) {
      setHighlightedRect(null);
      setTooltipPosition(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightedRect(rect);

      // Calculate tooltip position (estimate 384px width, 200px height for max-w-md)
      const tooltipWidth = Math.min(384, window.innerWidth - 2 * VIEWPORT_PADDING);
      const tooltipHeight = 200; // Approximate height
      const position = calculateTooltipPosition(
        rect,
        step.preferredPosition,
        tooltipWidth,
        tooltipHeight
      );
      setTooltipPosition(position);
    } else {
      // Element not found, center the tooltip
      const tooltipWidth = Math.min(384, window.innerWidth - 2 * VIEWPORT_PADDING);
      const tooltipHeight = 200;
      setHighlightedRect(null);
      setTooltipPosition(calculateTooltipPosition(null, 'center', tooltipWidth, tooltipHeight));
    }
  }, [currentStep, isVisible]);

  // Update positions when step changes or window resizes
  useEffect(() => {
    updatePositions();

    const handleResize = () => {
      updatePositions();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [updatePositions]);

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
            className="absolute border-4 border-primary rounded-lg transition-all duration-300"
            style={{
              top: `${highlightedRect.top - 8}px`,
              left: `${highlightedRect.left - 8}px`,
              width: `${highlightedRect.width + 16}px`,
              height: `${highlightedRect.height + 16}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        )}
      </div>

      {/* Tour content card */}
      <div
        className="absolute bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full transition-all duration-300"
        style={
          tooltipPosition
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                margin: `0 ${VIEWPORT_PADDING}px`
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: `0 ${VIEWPORT_PADDING}px`
              }
        }
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h2 id="tour-title" className="text-lg font-semibold text-foreground pr-8">
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
