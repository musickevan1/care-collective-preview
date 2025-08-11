'use client';

import { useReadableMode } from '@/app/context/ReadableModeContext';
import { Button } from '@/components/ui/button';

export function ReadableModeToggle() {
  const { readableMode, toggleReadableMode } = useReadableMode();
  
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      role="switch"
      aria-checked={readableMode}
      aria-label={readableMode ? 'Disable readable mode' : 'Enable readable mode'}
      onClick={toggleReadableMode}
      className="flex items-center gap-2"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {readableMode ? (
          // Eye icon when readable mode is on
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          // Eye-off icon when readable mode is off
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
      <span className="hidden sm:inline">
        {readableMode ? 'Readable: On' : 'Readable: Off'}
      </span>
    </Button>
  );
}