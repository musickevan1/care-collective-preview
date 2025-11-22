'use client';

import { ReactElement } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HelpTooltipProps {
  /**
   * The help text content to display in the tooltip
   */
  content: string;

  /**
   * Placement of the tooltip relative to the trigger
   * @default 'top'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * Additional CSS classes for the trigger button
   */
  className?: string;

  /**
   * Accessible label for the help icon
   * @default 'Help'
   */
  ariaLabel?: string;
}

/**
 * HelpTooltip Component
 *
 * Displays a help icon that shows contextual help information when hovered or focused.
 * Fully keyboard accessible and WCAG 2.1 AA compliant.
 *
 * @example
 * ```tsx
 * <HelpTooltip
 *   content="Click on a conversation to view messages"
 *   side="right"
 * />
 * ```
 */
export function HelpTooltip({
  content,
  side = 'top',
  className = '',
  ariaLabel = 'Help'
}: HelpTooltipProps): ReactElement {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger
        type="button"
        className={`inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors ${className}`}
        aria-label={ariaLabel}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
