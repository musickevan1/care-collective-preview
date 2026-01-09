import { ReactElement, ReactNode } from 'react';

interface InfoCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Icon background color variant */
  iconBgColor?: 'sage' | 'primary' | 'dusty-rose' | 'accent';
  /** Optional bullet point items */
  items?: string[];
  /** Optional className for additional styling */
  className?: string;
}

/**
 * InfoCard - A warm, informational card component
 *
 * Used for displaying non-actionable information with optional
 * icon, description, and bullet points. Features organic hover
 * effects that feel nurturing and supportive.
 */
export function InfoCard({
  title,
  description,
  icon,
  iconBgColor = 'sage',
  items,
  className = ''
}: InfoCardProps): ReactElement {
  const iconBgClasses = {
    sage: 'bg-sage',
    primary: 'bg-primary',
    'dusty-rose': 'bg-dusty-rose',
    accent: 'bg-accent'
  };

  const borderClasses = {
    sage: 'border-sage/20 hover:border-sage/50',
    primary: 'border-primary/20 hover:border-primary/50',
    'dusty-rose': 'border-dusty-rose/20 hover:border-dusty-rose/50',
    accent: 'border-accent/20 hover:border-accent/50'
  };

  return (
    <article
      className={`
        group relative overflow-hidden
        bg-white rounded-2xl border-2 ${borderClasses[iconBgColor]}
        shadow-sm hover:shadow-xl
        transition-all duration-500 ease-out
        hover:-translate-y-1
        ${className}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          bg-gradient-to-br from-${iconBgColor}/5 via-transparent to-transparent
          pointer-events-none
        `}
        aria-hidden="true"
      />

      <div className="relative p-6 md:p-8">
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div
              className={`
                flex-shrink-0 p-3 rounded-xl ${iconBgClasses[iconBgColor]}
                shadow-lg shadow-${iconBgColor}/20
                group-hover:scale-105 transition-transform duration-300
              `}
            >
              <div className="text-white w-6 h-6">
                {icon}
              </div>
            </div>
          )}
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight pt-1">
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-foreground/70 leading-relaxed mb-4 text-base md:text-lg">
          {description}
        </p>

        {/* Optional bullet items */}
        {items && items.length > 0 && (
          <ul className="space-y-3 mt-6">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-foreground/80"
              >
                <span
                  className={`
                    flex-shrink-0 w-2 h-2 mt-2 rounded-full
                    ${iconBgClasses[iconBgColor]}
                  `}
                  aria-hidden="true"
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
