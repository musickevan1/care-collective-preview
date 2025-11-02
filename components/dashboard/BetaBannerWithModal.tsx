'use client';

import { ReactElement, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { BetaTesterWrapper } from '@/components/beta/BetaTesterWrapper';

export function BetaBannerWithModal(): ReactElement {
  const [forceOpenModal, setForceOpenModal] = useState(false);

  const handleReopenModal = () => {
    setForceOpenModal(true);
  };

  return (
    <BetaTesterWrapper
      showWelcomeModal={true}
      forceOpenModal={forceOpenModal}
      onModalOpenChange={(open) => {
        if (!open) {
          setForceOpenModal(false);
        }
      }}
    >
      {/* Beta Testing Notice Banner */}
      <div className="bg-gradient-to-r from-sage/10 to-primary/10 border-2 border-sage/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">🚀</div>
          <div className="flex-1">
            <h3 className="font-semibold text-secondary mb-1 flex items-center gap-2 flex-wrap">
              Beta Testing Phase
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </h3>
            <p className="text-secondary/80 text-sm mb-3">
              Welcome to Care Collective Beta! You&apos;re helping us build something special. Your
              feedback shapes the future of mutual aid in our community. Report issues or suggestions to
              help us improve.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopenModal}
              className="gap-2 min-h-[36px]"
            >
              <Info className="w-4 h-4" />
              View Beta Guide
            </Button>
          </div>
        </div>
      </div>
    </BetaTesterWrapper>
  );
}
