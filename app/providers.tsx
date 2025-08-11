'use client';

import { ReadableModeProvider } from '@/app/context/ReadableModeContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReadableModeProvider>
      {children}
    </ReadableModeProvider>
  );
}