// LAUNCH: Disabled beta testing - component commented out for production launch
// Code preserved for potential future feedback/bug reporting features
// To re-enable, remove this block comment and uncomment all code below

/*
'use client';

import { ReactElement, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BugReportButton } from './BugReportButton';
import { BetaWelcomeModal } from './BetaWelcomeModal';

interface BetaTesterWrapperProps {
  showWelcomeModal?: boolean;
  showBanner?: boolean;
  forceOpenModal?: boolean;
  onModalOpenChange?: (open: boolean) => void;
  onReopenModal?: () => void;
  children?: React.ReactNode;
}

export function BetaTesterWrapper({
  showWelcomeModal = false,
  showBanner = false,
  forceOpenModal = false,
  onModalOpenChange,
  onReopenModal,
  children
}: BetaTesterWrapperProps): ReactElement | null {
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBetaTesterStatus() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_beta_tester, is_admin')
          .eq('id', user.id)
          .single();

        // Show beta features for both beta testers and admins
        setIsBetaTester(profile?.is_beta_tester || profile?.is_admin || false);
      } catch (error) {
        console.error('Error checking beta tester status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkBetaTesterStatus();
  }, []);

  // Don't render anything while loading or if not a beta tester/admin
  if (isLoading || !isBetaTester) {
    return null;
  }

  return (
    <>
      <BugReportButton />
      {showWelcomeModal && (
        <BetaWelcomeModal
          forceOpen={forceOpenModal}
          onOpenChange={onModalOpenChange}
        />
      )}
      {children}
    </>
  );
}
*/
