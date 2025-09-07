/**
 * @fileoverview Avatar component with Care Collective styling
 * Displays user initials with fallback support
 */

'use client';

import { ReactElement } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ 
  name, 
  className, 
  size = 'md' 
}: AvatarProps): ReactElement {
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

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold bg-dusty-rose text-white',
        sizeClasses[size],
        className
      )}
      aria-label={`${name}'s avatar`}
    >
      {getInitials(name)}
    </div>
  );
}