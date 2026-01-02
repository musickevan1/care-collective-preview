/**
 * @fileoverview Consistent section header component for public pages
 * Matches homepage section header style with visual hierarchy
 */

import { ReactElement } from 'react';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional icon to display */
  icon?: ReactElement;
  /** Icon background color variant */
  iconBgColor?: 'sage' | 'primary' | 'dusty-rose' | 'accent';
  /** Optional className for the container */
  className?: string;
  /** Optional className for the description */
  descriptionClassName?: string;
}

/**
 * Consistent section header with optional icon
 * Matches homepage section header style with uppercase tracking
 */
export function SectionHeader({
  title,
  description,
  icon,
  iconBgColor = 'primary',
  className = '',
  descriptionClassName = ''
}: SectionHeaderProps): ReactElement {
  const colorClasses = {
    sage: 'bg-sage/10',
    primary: 'bg-primary/10',
    'dusty-rose': 'bg-dusty-rose/10',
    accent: 'bg-accent/10'
  };

  return (
    <div className={`mb-12 ${className}`}>
      <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
        {title}
      </h2>
      {description && (
        <p className={`text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  );
}
