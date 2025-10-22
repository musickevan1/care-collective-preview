'use client';

import { ReactNode } from 'react';
import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
// TEMPORARILY DISABLED to debug React Error #419
// import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    // TEMPORARILY REMOVED ErrorBoundary to see actual server errors
    // <ErrorBoundary>
      <AuthProvider>
        <ReadableModeProvider>
          {children}
        </ReadableModeProvider>
      </AuthProvider>
    // </ErrorBoundary>
  );
}