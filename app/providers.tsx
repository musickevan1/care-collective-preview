'use client';

import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ReactNode, useEffect } from 'react';
import { setupErrorHandlingAndMonitoring } from '@/lib/error-setup';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize error handling and monitoring on app start
    setupErrorHandlingAndMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <ReadableModeProvider>
        {children}
      </ReadableModeProvider>
    </ErrorBoundary>
  );
}