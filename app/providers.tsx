'use client';

import { ReactNode } from 'react';
import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ReadableModeProvider>
          {children}
        </ReadableModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}