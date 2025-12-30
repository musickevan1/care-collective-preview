/**
 * @fileoverview Consistent CTA button component for public pages
 * Provides sage gradient button with arrow icon and proper accessibility
 */

import { ReactElement } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface CTAButtonProps {
  /** URL to navigate to */
  href: string;
  /** Button content */
  children: ReactElement | string;
  /** Button variant - primary (sage gradient) or secondary (outline) */
  variant?: 'primary' | 'secondary';
  /** Additional CSS classes */
  className?: string;
  /** Whether to open in new tab */
  external?: boolean;
}

/**
 * Consistent call-to-action button with sage gradient background
 * Meets accessibility requirements with 48px minimum touch target and visible focus states
 */
export function CTAButton({
  href,
  children,
  variant = 'primary',
  className = '',
  external = false
}: CTAButtonProps): ReactElement {
  const baseClasses = 'inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-lg font-bold shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none min-h-[56px]';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-sage to-sage-dark text-white hover:from-sage-dark hover:to-sage focus:ring-4 focus:ring-sage/30',
    secondary: 'border-2 border-sage text-sage hover:bg-sage/10 focus:ring-2 focus:ring-sage/50'
  };

  const linkProps = external ? {
    href,
    target: '_blank',
    rel: 'noopener noreferrer'
  } : { href };

  return (
    <Link
      {...linkProps}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <span>{children}</span>
      <ArrowRight className="w-5 h-5" />
    </Link>
  );
}
