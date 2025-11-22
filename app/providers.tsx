'use client';

import { ReactNode } from 'react';
// TEMPORARILY DISABLED to debug React Error #419
// import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    // TEMPORARILY REMOVED ErrorBoundary to see actual server errors
    // <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    // </ErrorBoundary>
  );
}