'use client';

import { ReactElement, useState, useEffect, useCallback } from 'react';
import { Check, Shield, Users, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { SignatureData } from './TypedSignatureField';

export interface WaiverDocumentProps {
  expectedName: string;
  userId?: string;
  onSignatureComplete?: (data: SignatureData) => void;
  documentVersion?: string;
  disabled?: boolean;
  className?: string;
  // Allow external control of signature state for syncing between views
  externalSignatureState?: {
    typedSignature: string;
    hasReadWaiver: boolean;
    signedAt: Date | null;
    isComplete: boolean;
  };
  onStateChange?: (state: {
    typedSignature: string;
    hasReadWaiver: boolean;
    signedAt: Date | null;
    isComplete: boolean;
  }) => void;
}

function formatTimestamp(date: Date): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  
  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);
  
  return `${datePart} at ${timePart}`;
}

function generateRecordId(userId?: string): string {
  if (userId) {
    return `CC-${userId.substring(0, 8).toUpperCase()}`;
  }
  return 'CC-PREVIEW';
}

interface WaiverSectionProps {
  icon: ReactElement;
  title: string;
  items: string[];
}

function WaiverSection({ icon, title, items }: WaiverSectionProps): ReactElement {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 border-b border-sage/30 pb-1">
        <div className="p-0.5 bg-sage/10 rounded">
          {icon}
        </div>
        <h3 className="font-semibold text-foreground uppercase tracking-wide text-xs">
          {title}
        </h3>
      </div>
      <ul className="space-y-1 ml-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-xs text-foreground leading-snug">
            <span className="text-sage mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WaiverDocument({
  expectedName,
  userId,
  onSignatureComplete,
  documentVersion = '1.0',
  disabled = false,
  className = '',
  externalSignatureState,
  onStateChange,
}: WaiverDocumentProps): ReactElement {
  // Use external state if provided, otherwise use internal state
  const [internalTypedSignature, setInternalTypedSignature] = useState('');
  const [internalHasReadWaiver, setInternalHasReadWaiver] = useState(false);
  const [internalSignedAt, setInternalSignedAt] = useState<Date | null>(null);
  const [internalIsComplete, setInternalIsComplete] = useState(false);

  const typedSignature = externalSignatureState?.typedSignature ?? internalTypedSignature;
  const hasReadWaiver = externalSignatureState?.hasReadWaiver ?? internalHasReadWaiver;
  const signedAt = externalSignatureState?.signedAt ?? internalSignedAt;
  const isComplete = externalSignatureState?.isComplete ?? internalIsComplete;

  const setTypedSignature = (value: string) => {
    setInternalTypedSignature(value);
    onStateChange?.({
      typedSignature: value,
      hasReadWaiver,
      signedAt,
      isComplete,
    });
  };

  const setHasReadWaiver = (value: boolean) => {
    setInternalHasReadWaiver(value);
    onStateChange?.({
      typedSignature,
      hasReadWaiver: value,
      signedAt,
      isComplete,
    });
  };

  const recordId = generateRecordId(userId);

  // Normalize names for comparison
  const normalizeString = (str: string): string => str.trim().toLowerCase();
  const namesMatch = normalizeString(typedSignature) === normalizeString(expectedName);
  const canComplete = namesMatch && hasReadWaiver && typedSignature.length > 0;

  const handleSignatureComplete = useCallback(() => {
    if (!canComplete || isComplete) return;

    const now = new Date();
    setInternalSignedAt(now);
    setInternalIsComplete(true);
    
    onStateChange?.({
      typedSignature,
      hasReadWaiver,
      signedAt: now,
      isComplete: true,
    });

    const signatureData: SignatureData = {
      signedName: typedSignature.trim(),
      signedAt: now.toISOString(),
      documentVersion,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      namesMatch: true,
      recordId,
    };

    onSignatureComplete?.(signatureData);
  }, [canComplete, isComplete, typedSignature, hasReadWaiver, documentVersion, recordId, onSignatureComplete, onStateChange]);

  // Auto-complete when valid
  useEffect(() => {
    if (canComplete && !isComplete) {
      handleSignatureComplete();
    }
  }, [canComplete, isComplete, handleSignatureComplete]);

  const sections = [
    {
      icon: <Shield className="w-4 h-4 text-sage" />,
      title: 'Safety & Personal Responsibility',
      items: [
        'I will use good judgment when meeting or exchanging with other members',
        'I will meet in public places when possible and trust my instincts',
        'I will communicate promptly if plans change or I cannot follow through',
      ],
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-sage" />,
      title: 'Platform Limitations',
      items: [
        'CARE Collective is a volunteer-based mutual aid platform',
        'The platform does not verify members\' identities, backgrounds, or capabilities',
        'CARE Collective and Missouri State University are not liable for interactions or outcomes between members',
        'My participation is voluntary and at my own risk',
      ],
    },
    {
      icon: <Users className="w-4 h-4 text-sage" />,
      title: 'Community Standards',
      items: [
        'I will treat all members with respect and without judgment',
        'I will keep shared information confidential',
        'I will use member contact details only for CARE Collective exchanges',
        'I will report safety concerns to the administrator',
        'I understand my membership may be paused or removed if my behavior compromises community safety or trust',
      ],
    },
  ];

  return (
    <div 
      className={`bg-white shadow-lg print:shadow-none ${className}`}
      style={{ 
        width: '8.5in',
        minHeight: '11in',
        padding: '0.5in 0.6in',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <header className="flex items-center border-b-2 border-sage pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-textless.png"
            alt="CARE Collective"
            width={40}
            height={40}
            className="print:w-10 print:h-10"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">CARE Collective</h1>
            <p className="text-xs text-muted-foreground">Caregiver Assistance and Resource Exchange</p>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground">
          Community Safety Guidelines & Liability Waiver
        </h2>
      </div>

      {/* Introduction */}
      <p className="text-xs text-foreground mb-4 leading-snug">
        By joining the CARE Collective, I acknowledge and agree to the following:
      </p>

      {/* Waiver Sections */}
      <div className="mb-4">
        {sections.map((section, index) => (
          <WaiverSection
            key={index}
            icon={section.icon}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>

      {/* Acknowledgment Checkbox */}
      <div className="border-t border-sage/30 pt-3 mb-3">
        <label 
          className={`flex items-start gap-2 cursor-pointer ${
            disabled || isComplete ? 'cursor-not-allowed' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={hasReadWaiver}
            onChange={(e) => !isComplete && setHasReadWaiver(e.target.checked)}
            disabled={disabled || isComplete}
            className="w-4 h-4 text-sage accent-sage flex-shrink-0 mt-0.5 rounded print:appearance-auto"
          />
          <span className="text-xs text-foreground font-medium">
            I have read and understand the Safety Guidelines & Liability Waiver above.
          </span>
        </label>
      </div>

      {/* Signature Section */}
      <div className={`border-2 rounded-lg p-3 ${
        isComplete ? 'border-green-500 bg-green-50/30' : 'border-sage/40 bg-sage/5'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="font-semibold uppercase tracking-wide text-xs text-foreground">
            Digital Signature
          </h3>
          {!isComplete && (
            <span className="text-xs text-muted-foreground">
              (type your full legal name to sign)
            </span>
          )}
        </div>

        {/* Signature Input */}
        <div className="max-w-sm mx-auto">
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold text-sage/60 select-none print:text-sage pb-0.5">
              &#10007;
            </span>
            
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => !isComplete && setTypedSignature(e.target.value)}
              disabled={disabled || isComplete}
              placeholder={expectedName}
              className={`flex-1 px-2 py-0.5 text-lg bg-transparent border-0 border-b-2 
                focus:outline-none focus:ring-0 transition-all
                placeholder:text-muted-foreground/30 placeholder:font-normal
                print:border-foreground
                ${isComplete 
                  ? 'border-green-500 text-green-800' 
                  : 'border-sage/40 focus:border-sage text-foreground'
                }`}
              style={{ 
                fontFamily: 'var(--font-caveat), Brush Script MT, cursive',
              }}
              aria-label="Type your full legal name to sign"
            />
          </div>
        </div>

        {/* Name Match Indicator (hide in print) */}
        {typedSignature.length > 0 && !isComplete && (
          <div className={`text-center text-xs mt-1 print:hidden ${
            namesMatch ? 'text-green-600' : 'text-amber-600'
          }`}>
            {namesMatch ? (
              <span className="flex items-center justify-center gap-1">
                <Check className="w-3 h-3" />
                Name matches
              </span>
            ) : (
              <span>Please type your name exactly as: {expectedName}</span>
            )}
          </div>
        )}

        {/* Signature Confirmation - inside the box */}
        {isComplete && signedAt && (
          <div className="mt-2 pt-2 border-t border-green-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-green-700">
              <Check className="w-3 h-3" />
              <span>Signed on {formatTimestamp(signedAt)}</span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold">Record ID:</span> {recordId}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-4 pt-3 border-t border-muted text-center text-muted-foreground">
        <p className="text-sm font-semibold">CARE Collective</p>
        <p className="text-xs">Caregiver Assistance and Resource Exchange</p>
        <p className="text-xs">swmocarecollective@gmail.com</p>
      </footer>
    </div>
  );
}

export default WaiverDocument;
