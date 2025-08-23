'use client';

import { ReactNode } from 'react';
// Temporarily disable all complex providers to isolate build issue
// import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
// import { ErrorBoundary } from '@/components/ErrorBoundary';
// import { setupErrorHandlingAndMonitoring } from '@/lib/error-setup';

export function Providers({ children }: { children: ReactNode }) {
  // Temporarily disable all setup to isolate the build issue
  // useEffect(() => {
  //   // Initialize error handling and monitoring on app start
  //   // Only run client-side to prevent SSR issues
  //   if (typeof window !== 'undefined') {
  //     try {
  //       setupErrorHandlingAndMonitoring();
  //     } catch (error) {
  //       console.warn('Failed to setup error handling and monitoring:', error);
  //     }
  //   }
  // }, []);

  // Minimal providers for deployment testing
  return (
    <>
      {children}
    </>
  );
}