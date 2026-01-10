/**
 * @fileoverview Reusable skeleton components for loading states
 *
 * Provides composable skeleton primitives that match the Care Collective
 * design system. Uses Tailwind's animate-pulse for smooth loading animations.
 *
 * Features:
 * - Accessibility: Reduced motion support via prefers-reduced-motion
 * - Composable: Build complex loading states from simple primitives
 * - Consistent: Matches design system colors and patterns
 */

import { ReactElement } from 'react';
import { cn } from '@/lib/utils';

/**
 * Base skeleton primitive with animated pulse effect
 * Respects prefers-reduced-motion for accessibility
 */
interface SkeletonProps {
  className?: string;
  'aria-hidden'?: boolean;
}

export function Skeleton({
  className,
  'aria-hidden': ariaHidden = true
}: SkeletonProps): ReactElement {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(
        // Base skeleton styles
        'bg-muted rounded',
        // Animate pulse with reduced motion support
        'animate-pulse motion-reduce:animate-none',
        className
      )}
    />
  );
}

/**
 * Text skeleton for single or multi-line text content
 */
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: 'full' | 'two-thirds' | 'half' | 'one-third';
}

export function TextSkeleton({
  lines = 1,
  className,
  lastLineWidth = 'two-thirds'
}: TextSkeletonProps): ReactElement {
  const widthClasses = {
    'full': 'w-full',
    'two-thirds': 'w-2/3',
    'half': 'w-1/2',
    'one-third': 'w-1/3'
  };

  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 && lines > 1 ? widthClasses[lastLineWidth] : 'w-full'
          )}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Avatar skeleton for profile images
 */
interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarSkeleton({
  size = 'md',
  className
}: AvatarSkeletonProps): ReactElement {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  );
}

/**
 * Card skeleton for dashboard cards, help request cards, etc.
 * Matches the Card component structure from components/ui/card.tsx
 */
interface CardSkeletonProps {
  hasAvatar?: boolean;
  hasDescription?: boolean;
  hasFooter?: boolean;
  className?: string;
}

export function CardSkeleton({
  hasAvatar = false,
  hasDescription = true,
  hasFooter = true,
  className
}: CardSkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm space-y-4',
        className
      )}
      role="status"
      aria-label="Loading card"
    >
      {/* Header with optional avatar */}
      <div className="flex items-start gap-4">
        {hasAvatar && <AvatarSkeleton size="md" />}
        <div className="flex-1 space-y-2">
          {/* Title */}
          <Skeleton className="h-5 w-3/4" />
          {/* Subtitle/metadata */}
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Description */}
      {hasDescription && (
        <TextSkeleton lines={2} lastLineWidth="two-thirds" />
      )}

      {/* Footer with badges/buttons */}
      {hasFooter && (
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      )}

      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * List skeleton for lists of items with avatars
 */
interface ListSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({
  items = 3,
  hasAvatar = true,
  className
}: ListSkeletonProps): ReactElement {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 border rounded-lg"
        >
          {hasAvatar && <AvatarSkeleton size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Stats card skeleton for dashboard statistics
 */
interface StatsCardSkeletonProps {
  className?: string;
}

export function StatsCardSkeleton({ className }: StatsCardSkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-6 shadow-sm space-y-2',
        className
      )}
      role="status"
      aria-label="Loading statistics"
    >
      {/* Label */}
      <Skeleton className="h-4 w-24" />
      {/* Value */}
      <Skeleton className="h-10 w-16" />
      {/* Description */}
      <Skeleton className="h-3 w-32" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Form skeleton for form fields
 */
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({
  fields = 3,
  className
}: FormSkeletonProps): ReactElement {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading form"
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-24" />
          {/* Input */}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {/* Button */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-20" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Button skeleton
 */
interface ButtonSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ButtonSkeleton({
  size = 'md',
  className
}: ButtonSkeletonProps): ReactElement {
  const sizeClasses = {
    sm: 'h-9 w-20',
    md: 'h-11 w-24',
    lg: 'h-12 w-32'
  };

  return <Skeleton className={cn(sizeClasses[size], className)} />;
}

/**
 * Badge skeleton for inline badges
 */
interface BadgeSkeletonProps {
  className?: string;
}

export function BadgeSkeleton({ className }: BadgeSkeletonProps): ReactElement {
  return <Skeleton className={cn('h-5 w-16 rounded-full', className)} />;
}

/**
 * Page header skeleton with title and action button
 */
interface PageHeaderSkeletonProps {
  hasSubtitle?: boolean;
  hasAction?: boolean;
  className?: string;
}

export function PageHeaderSkeleton({
  hasSubtitle = true,
  hasAction = true,
  className
}: PageHeaderSkeletonProps): ReactElement {
  return (
    <div
      className={cn('flex items-center justify-between mb-8', className)}
      role="status"
      aria-label="Loading page header"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        {hasSubtitle && <Skeleton className="h-4 w-64" />}
      </div>
      {hasAction && <ButtonSkeleton size="md" />}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Dashboard quick action card skeleton
 */
interface QuickActionSkeletonProps {
  className?: string;
}

export function QuickActionSkeleton({ className }: QuickActionSkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading quick action"
    >
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </div>
      <div className="p-6 pt-0">
        <Skeleton className="h-11 w-full" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Profile info skeleton for profile pages
 */
interface ProfileInfoSkeletonProps {
  className?: string;
}

export function ProfileInfoSkeleton({ className }: ProfileInfoSkeletonProps): ReactElement {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-label="Loading profile information"
    >
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-2">
        <AvatarSkeleton size="xl" className="h-24 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Profile fields */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>

      {/* Status badges */}
      <div className="pt-4 border-t flex gap-2">
        <BadgeSkeleton />
        <BadgeSkeleton />
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
