import { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface ActionCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Icon background color variant */
  iconBgColor?: 'sage' | 'primary' | 'dusty-rose' | 'accent';
  /** CTA button label */
  actionLabel: string;
  /** Internal link href */
  actionHref?: string;
  /** Click handler (alternative to href) */
  actionOnClick?: () => void;
  /** Whether link opens externally */
  external?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * ActionCard - A warm, actionable card component
 *
 * Used for content that leads to an action (navigation, form, etc.)
 * Features inviting hover effects and a prominent CTA that
 * encourages engagement without being aggressive.
 */
export function ActionCard({
  title,
  description,
  icon,
  iconBgColor = 'sage',
  actionLabel,
  actionHref,
  actionOnClick,
  external = false,
  className = ''
}: ActionCardProps): ReactElement {
  const iconBgClasses = {
    sage: 'bg-sage',
    primary: 'bg-primary',
    'dusty-rose': 'bg-dusty-rose',
    accent: 'bg-accent'
  };

  const borderClasses = {
    sage: 'border-sage/20 hover:border-sage',
    primary: 'border-primary/20 hover:border-primary',
    'dusty-rose': 'border-dusty-rose/20 hover:border-dusty-rose',
    accent: 'border-accent/20 hover:border-accent'
  };

  const buttonClasses = {
    sage: 'bg-sage hover:bg-sage-dark text-white',
    primary: 'bg-primary hover:brightness-90 text-white',
    'dusty-rose': 'bg-dusty-rose hover:bg-dusty-rose-dark text-white',
    accent: 'bg-accent hover:brightness-90 text-foreground'
  };

  const ActionIcon = external ? ExternalLink : ArrowRight;

  const CardContent = (
    <>
      {/* Animated background gradient */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          bg-gradient-to-br from-${iconBgColor}/5 via-transparent to-${iconBgColor}/3
          pointer-events-none rounded-2xl
        `}
        aria-hidden="true"
      />

      <div className="relative p-6 md:p-8 flex flex-col h-full">
        {/* Header with icon */}
        <div className="flex items-start gap-4 mb-4">
          {icon && (
            <div
              className={`
                flex-shrink-0 p-3 rounded-xl ${iconBgClasses[iconBgColor]}
                shadow-lg shadow-${iconBgColor}/20
                group-hover:scale-110 group-hover:rotate-3
                transition-all duration-300 ease-out
              `}
            >
              <div className="text-white w-6 h-6">
                {icon}
              </div>
            </div>
          )}
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight pt-1 group-hover:text-foreground/90 transition-colors">
            {title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-foreground/70 leading-relaxed mb-6 text-base md:text-lg flex-grow">
          {description}
        </p>

        {/* CTA Button */}
        <div className="mt-auto">
          {actionHref ? (
            external ? (
              <a
                href={actionHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  inline-flex items-center gap-2 px-6 py-3
                  ${buttonClasses[iconBgColor]}
                  rounded-xl font-semibold text-base
                  transition-all duration-300
                  hover:shadow-lg hover:-translate-y-0.5
                  focus:outline-none focus:ring-2 focus:ring-${iconBgColor}/50 focus:ring-offset-2
                  min-h-[44px]
                `}
              >
                {actionLabel}
                <ActionIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <Link
                href={actionHref}
                className={`
                  inline-flex items-center gap-2 px-6 py-3
                  ${buttonClasses[iconBgColor]}
                  rounded-xl font-semibold text-base
                  transition-all duration-300
                  hover:shadow-lg hover:-translate-y-0.5
                  focus:outline-none focus:ring-2 focus:ring-${iconBgColor}/50 focus:ring-offset-2
                  min-h-[44px]
                `}
              >
                {actionLabel}
                <ActionIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )
          ) : (
            <button
              onClick={actionOnClick}
              className={`
                inline-flex items-center gap-2 px-6 py-3
                ${buttonClasses[iconBgColor]}
                rounded-xl font-semibold text-base
                transition-all duration-300
                hover:shadow-lg hover:-translate-y-0.5
                focus:outline-none focus:ring-2 focus:ring-${iconBgColor}/50 focus:ring-offset-2
                min-h-[44px]
              `}
            >
              {actionLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <article
      className={`
        group relative overflow-hidden
        bg-white rounded-2xl border-2 ${borderClasses[iconBgColor]}
        shadow-sm hover:shadow-xl
        transition-all duration-500 ease-out
        hover:-translate-y-1.5
        ${className}
      `}
    >
      {CardContent}
    </article>
  );
}
