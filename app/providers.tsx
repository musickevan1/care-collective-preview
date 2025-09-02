'use client';

import { ReactNode } from 'react';
import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ReadableModeProvider>
        {children}
      </ReadableModeProvider>
    </ErrorBoundary>
  );
}