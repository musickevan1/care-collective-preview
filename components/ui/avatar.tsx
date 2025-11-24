/**
 * @fileoverview Avatar component with Care Collective styling
 * Displays user profile picture with fallback to initials
 */

'use client';

import { ReactElement, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({
  name,
  avatarUrl,
  className,
  size = 'md'
}: AvatarProps): ReactElement {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const showImage = avatarUrl && !imageError;
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-semibold bg-dusty-rose text-white flex-shrink-0 overflow-hidden',
        sizeClasses[size],
        className
      )}
      aria-label={`${name}'s avatar`}
    >
      {showImage ? (
        <>
          {/* Loading placeholder */}
          {imageLoading && (
            <div className="absolute inset-0 bg-dusty-rose/20 animate-pulse" />
          )}

          {/* Profile image */}
          <Image
            src={avatarUrl}
            alt={`${name}'s profile picture`}
            fill
            sizes={size === 'lg' ? '48px' : size === 'md' ? '32px' : '24px'}
            className="object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </>
      ) : (
        // Fallback to initials
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}