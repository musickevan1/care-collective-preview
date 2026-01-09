'use client';

import { ReactElement, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, FileText, Pencil } from 'lucide-react';
import { WaiverContent } from './WaiverContent';

export interface SignatureData {
  signedName: string;
  signedAt: string;
  documentVersion: string;
  userAgent: string;
  namesMatch: boolean;
  recordId: string;
}

export interface TypedSignatureFieldProps {
  expectedName: string;
  userId?: string;
  onSignatureComplete?: (data: SignatureData) => void;
  documentVersion?: string;
  disabled?: boolean;
  className?: string;
}

function generateRecordId(userId?: string): string {
  if (userId) {
    return `CC-${userId.substring(0, 8).toUpperCase()}`;
  }
  return 'CC-PREVIEW';
}

function formatTimestamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  // Insert "at" before the time
  const parts = formatted.split(', ');
  if (parts.length >= 2) {
    const datePart = parts.slice(0, -1).join(', ');
    const timePart = parts[parts.length - 1];
    return `${datePart} at ${timePart}`;
  }
  return formatted;
}

export function TypedSignatureField({
  expectedName,
  userId,
  onSignatureComplete,
  documentVersion = '1.0',
  disabled = false,
  className = '',
}: TypedSignatureFieldProps): ReactElement {
  const [typedSignature, setTypedSignature] = useState('');
  const [hasReadWaiver, setHasReadWaiver] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const recordId = generateRecordId(userId);

  // Normalize names for comparison (case-insensitive, trimmed)
  const normalizeString = (str: string): string => str.trim().toLowerCase();
  
  const namesMatch = normalizeString(typedSignature) === normalizeString(expectedName);
  const canComplete = namesMatch && hasReadWaiver && typedSignature.length > 0;

  const handleSignatureComplete = useCallback(() => {
    if (!canComplete || isComplete) return;

    const now = new Date();
    setSignedAt(now);
    setIsComplete(true);

    const signatureData: SignatureData = {
      signedName: typedSignature.trim(),
      signedAt: now.toISOString(),
      documentVersion,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      namesMatch: true,
      recordId,
    };

    onSignatureComplete?.(signatureData);
  }, [canComplete, isComplete, typedSignature, documentVersion, recordId, onSignatureComplete]);

  // Auto-complete when valid
  useEffect(() => {
    if (canComplete && !isComplete) {
      handleSignatureComplete();
    }
  }, [canComplete, isComplete, handleSignatureComplete]);

  return (
    <Card className={`border-sage/30 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl text-foreground">
          <div className="p-2 bg-sage/10 rounded-lg">
            <FileText className="w-5 h-5 text-sage" />
          </div>
          Community Safety Guidelines & Liability Waiver
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Waiver Content - Scrollable */}
        <div className="border border-sage/20 bg-sage/5 rounded-lg p-4 max-h-64 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-4">
            By joining the CARE Collective, I acknowledge and agree to the following:
          </p>
          <WaiverContent />
        </div>

        {/* Checkbox Confirmation */}
        <label 
          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            hasReadWaiver 
              ? 'border-sage bg-sage/5' 
              : 'border-muted hover:border-sage/50'
          } ${disabled || isComplete ? 'cursor-not-allowed opacity-75' : ''}`}
        >
          <input
            type="checkbox"
            checked={hasReadWaiver}
            onChange={(e) => !isComplete && setHasReadWaiver(e.target.checked)}
            disabled={disabled || isComplete}
            className="w-5 h-5 text-sage accent-sage flex-shrink-0 mt-0.5 rounded"
          />
          <span className="text-sm text-foreground">
            I have read and understand the Safety Guidelines & Liability Waiver above.
          </span>
        </label>

        {/* Digital Signature Section */}
        <div className={`border-2 rounded-xl p-6 transition-all ${
          isComplete 
            ? 'border-green-500 bg-green-50/50' 
            : 'border-sage/30 bg-gradient-to-b from-sage/5 to-transparent'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`p-1.5 rounded-full ${isComplete ? 'bg-green-100' : 'bg-sage/10'}`}>
              <Pencil className={`w-4 h-4 ${isComplete ? 'text-green-600' : 'text-sage'}`} />
            </div>
            <h3 className={`font-semibold uppercase tracking-wide text-sm ${
              isComplete ? 'text-green-700' : 'text-sage-dark'
            }`}>
              Digital Signature
            </h3>
          </div>

          {/* Instructions */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            By typing your full legal name below, you confirm that you have read and agree to this waiver.
          </p>

          {/* Signature Input Area */}
          <div className="max-w-md mx-auto">
            <div className="flex items-end gap-2">
              {/* X marker */}
              <span className="text-2xl font-bold text-sage/60 select-none pb-1">
                &#10007;
              </span>
              
              {/* Signature Input */}
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => !isComplete && setTypedSignature(e.target.value)}
                disabled={disabled || isComplete}
                placeholder={expectedName}
                className={`flex-1 px-2 py-1 text-2xl bg-transparent border-0 border-b-2 
                  focus:outline-none focus:ring-0 transition-all
                  placeholder:text-muted-foreground/30 placeholder:font-normal
                  ${isComplete 
                    ? 'border-green-500 text-green-800 cursor-not-allowed' 
                    : 'border-sage/40 focus:border-sage text-foreground'
                  }`}
                style={{ 
                  fontFamily: 'var(--font-caveat), Brush Script MT, cursive',
                }}
                aria-label="Type your full legal name to sign"
              />
            </div>

            {/* Label */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Sign here (type your full legal name)
            </p>
          </div>

          {/* Name Match Indicator */}
          {typedSignature.length > 0 && !isComplete && (
            <div className={`mt-4 text-center text-sm ${
              namesMatch ? 'text-green-600' : 'text-amber-600'
            }`}>
              {namesMatch ? (
                <span className="flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  Name matches
                </span>
              ) : (
                <span>Please type your name exactly as: {expectedName}</span>
              )}
            </div>
          )}

          {/* Timestamp Badge - Shows when complete */}
          {isComplete && signedAt && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Signed electronically on {formatTimestamp(signedAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {isComplete && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Waiver signed successfully</p>
              <p className="text-sm text-green-700">
                Your agreement has been recorded and linked to your account.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TypedSignatureField;
