/**
 * @fileoverview Consistent page header component for public pages
 * Provides standardized header with optional icon and description
 */

import { ReactElement } from 'react';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional icon to display */
  icon?: ReactElement;
  /** Icon background color variant */
  iconBgColor?: 'sage' | 'primary' | 'dusty-rose' | 'accent';
  /** Whether to show icon (default: true) */
  showIcon?: boolean;
}

/**
 * Consistent page header with icon container and text
 * Uses solid tint backgrounds for cleaner appearance
 */
export function PageHeader({
  title,
  description,
  icon,
  iconBgColor = 'sage',
  showIcon = true
}: PageHeaderProps): ReactElement {
  const colorClasses = {
    sage: 'bg-sage/10',
    primary: 'bg-primary/10',
    'dusty-rose': 'bg-dusty-rose/10',
    accent: 'bg-accent/10'
  };

  return (
    <div className="text-center mb-12">
      {showIcon && icon && (
        <div className={`inline-block p-3 rounded-full mb-4 ${colorClasses[iconBgColor]}`}>
          {icon}
        </div>
      )}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
      {description && (
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{description}</p>
      )}
    </div>
  );
}
