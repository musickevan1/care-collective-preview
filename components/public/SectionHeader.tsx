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
}

/**
 * Consistent section header with optional icon
 * Matches homepage section header style with uppercase tracking
 */
export function SectionHeader({
  title,
  description,
  icon,
  iconBgColor = 'primary'
}: SectionHeaderProps): ReactElement {
  const iconBgClasses = {
    sage: 'bg-sage',
    primary: 'bg-primary',
    'dusty-rose': 'bg-dusty-rose',
    accent: 'bg-accent'
  };

  return (
    <div className="mb-8">
      {/* Title with optional icon */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBgClasses[iconBgColor]} shadow-md`}>
            {icon}
          </div>
        )}
        <h2 className="text-[clamp(24px,4vw,36px)] font-bold text-brown uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed text-center">
          {description}
        </p>
      )}
    </div>
  );
}
