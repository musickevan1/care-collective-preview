import { ReactElement, ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  /** Resource title */
  title: string;
  /** Resource description */
  description: string;
  /** External URL (optional - card becomes informational if not provided) */
  url?: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Icon/accent color variant */
  colorVariant?: 'sage' | 'primary' | 'dusty-rose' | 'accent';
  /** Optional className for additional styling */
  className?: string;
}

/**
 * ResourceCard - External resource link card
 *
 * A polished card for linking to external resources with
 * distinctive hover effects and clear visual hierarchy.
 * Extracted from the Resources page pattern.
 */
export function ResourceCard({
  title,
  description,
  url,
  icon,
  colorVariant = 'sage',
  className = ''
}: ResourceCardProps): ReactElement {
  const borderClasses = {
    sage: 'border-sage/20 hover:border-sage',
    primary: 'border-primary/20 hover:border-primary',
    'dusty-rose': 'border-dusty-rose/20 hover:border-dusty-rose',
    accent: 'border-accent/20 hover:border-accent'
  };

  const iconColorClasses = {
    sage: 'text-sage',
    primary: 'text-primary',
    'dusty-rose': 'text-dusty-rose',
    accent: 'text-accent'
  };

  const linkClasses = {
    sage: 'text-sage hover:text-sage-dark',
    primary: 'text-primary hover:brightness-90',
    'dusty-rose': 'text-dusty-rose hover:text-dusty-rose-dark',
    accent: 'text-accent hover:brightness-90'
  };

  return (
    <article
      className={`
        group relative overflow-hidden
        bg-white rounded-2xl border-2 ${borderClasses[colorVariant]}
        shadow-sm hover:shadow-xl
        transition-all duration-500 ease-out
        hover:-translate-y-1.5
        ${className}
      `}
    >
      {/* Subtle hover gradient */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          bg-gradient-to-br from-${colorVariant}/5 via-transparent to-transparent
          pointer-events-none
        `}
        aria-hidden="true"
      />

      <div className="relative p-6 md:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            {icon && (
              <div className={`flex-shrink-0 mt-1 ${iconColorClasses[colorVariant]}`}>
                {icon}
              </div>
            )}
            <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">
              {title}
            </h3>
          </div>
          {url && (
            <ExternalLink
              className={`
                flex-shrink-0 w-5 h-5 ${iconColorClasses[colorVariant]}
                opacity-50 group-hover:opacity-100
                group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                transition-all duration-300
              `}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Description */}
        <p className={`text-foreground/70 leading-relaxed text-base flex-grow ${url ? 'mb-4' : ''}`}>
          {description}
        </p>

        {/* Visit Link - only shown if URL provided */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-flex items-center gap-2 font-semibold ${linkClasses[colorVariant]}
              transition-all duration-300
              hover:gap-3
              focus:outline-none focus:ring-2 focus:ring-${colorVariant}/50 rounded
              min-h-[44px] py-2
            `}
          >
            Visit Website
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </article>
  );
}
