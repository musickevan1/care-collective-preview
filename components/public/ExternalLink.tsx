/**
 * @fileoverview Consistent external link component with focus states
 * Provides accessible external links with proper visual feedback
 */

import { ReactElement } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';

export interface ExternalLinkProps {
  /** URL to navigate to */
  href: string;
  /** Link content */
  children: ReactElement | string;
  /** Additional CSS classes */
  className?: string;
  /** Icon variant - default or chevron */
  icon?: 'arrow' | 'chevron';
}

/**
 * Consistent external link with focus state and optional icon
 * Meets accessibility requirements with visible focus rings
 */
export function ExternalLink({
  href,
  children,
  className = '',
  icon = 'chevron'
}: ExternalLinkProps): ReactElement {
  const baseClasses = 'inline-flex items-center gap-2 text-sage hover:text-sage-dark font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sage/50 rounded';

  const Icon = icon === 'arrow' ? ExternalLinkIcon : () => null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${className}`}
    >
      <span>{children}</span>
      {icon === 'arrow' && <Icon className="w-4 h-4" />}
    </a>
  );
}
