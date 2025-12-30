/**
 * @fileoverview Consistent section header component for public pages
 * Provides standardized section headers with optional icon and description
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
 * Consistent section header with small icon container and text
 * Uses solid tint backgrounds for cleaner appearance
 */
export function SectionHeader({
  title,
  description,
  icon,
  iconBgColor = 'primary'
}: SectionHeaderProps): ReactElement {
  const colorClasses = {
    sage: 'bg-sage/10',
    primary: 'bg-primary/10',
    'dusty-rose': 'bg-dusty-rose/10',
    accent: 'bg-accent/10'
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {icon && (
        <div className={`p-2 rounded-lg ${colorClasses[iconBgColor]}`}>
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
