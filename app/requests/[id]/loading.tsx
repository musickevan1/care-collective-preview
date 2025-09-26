/**
 * @fileoverview Loading state for help request detail page
 * Uses the enhanced loading skeleton components for better UX
 */

import { ReactElement } from 'react';
import { HelpRequestDetailSkeleton } from '@/components/LoadingSkeleton';

export default function Loading(): ReactElement {
  return (
    <HelpRequestDetailSkeleton 
      aria-label="Loading help request details, please wait..."
    />
  );
}