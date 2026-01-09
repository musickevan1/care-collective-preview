'use client';

import { ReactElement, useState } from 'react';
import { TypedSignatureField, WaiverDocument, SignatureData } from '@/components/legal';
import { Button } from '@/components/ui/button';
import { RotateCcw, FileText, ClipboardList, Download } from 'lucide-react';

type ViewMode = 'form' | 'document';

export default function WaiverPreviewPage(): ReactElement {
  const [key, setKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('document');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  
  // Shared signature state between both views
  const [sharedState, setSharedState] = useState({
    typedSignature: '',
    hasReadWaiver: false,
    signedAt: null as Date | null,
    isComplete: false,
  });

  const handleSignatureComplete = (data: SignatureData) => {
    setSignatureData(data);
    console.log('Signature completed:', data);
  };

  const handleReset = () => {
    setKey(prev => prev + 1);
    setSignatureData(null);
    setSharedState({
      typedSignature: '',
      hasReadWaiver: false,
      signedAt: null,
      isComplete: false,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Header - Hidden in print */}
      <div className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-sage font-semibold mb-1">
                Preview Only
              </p>
              <h1 className="text-xl font-bold text-foreground">
                Waiver Component Preview
              </h1>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('form')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'form' 
                      ? 'bg-sage text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Form View
                </button>
                <button
                  onClick={() => setViewMode('document')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'document' 
                      ? 'bg-sage text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Document View
                </button>
              </div>

              {/* Action Buttons */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              
              {viewMode === 'document' && (
                <Button 
                  variant="sage" 
                  size="sm" 
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Print / Save PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`py-8 print:py-0 ${viewMode === 'form' ? 'px-4' : 'px-0'}`}>
        {viewMode === 'form' ? (
          /* Form View - Card Style Component */
          <div className="max-w-2xl mx-auto">
            <TypedSignatureField
              key={`form-${key}`}
              expectedName="Jane Doe"
              onSignatureComplete={handleSignatureComplete}
              documentVersion="1.0"
            />
          </div>
        ) : (
          /* Document View - Print-friendly Layout */
          <WaiverDocument
            key={`doc-${key}`}
            expectedName="Jane Doe"
            userId="a1b2c3d4-5678-90ab-cdef-1234567890ab"
            onSignatureComplete={handleSignatureComplete}
            documentVersion="1.0"
            externalSignatureState={sharedState}
            onStateChange={setSharedState}
          />
        )}
      </div>

      {/* Debug Info - Hidden in print */}
      {signatureData && (
        <div className="print:hidden max-w-2xl mx-auto px-4 pb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
              Captured Signature Data (for development)
            </p>
            <pre className="text-xs text-green-400 overflow-x-auto">
              {JSON.stringify(signatureData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions - Hidden in print */}
      <div className="print:hidden max-w-2xl mx-auto px-4 pb-8">
        <div className="p-4 border border-dashed border-sage/30 rounded-lg bg-sage/5">
          <p className="text-sm text-muted-foreground">
            <strong>To create PDF for client:</strong>
          </p>
          <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
            <li>Switch to <strong>Document View</strong> using the toggle above</li>
            <li>Type &quot;Jane Doe&quot; in the signature field</li>
            <li>Check the acknowledgment checkbox</li>
            <li>Click <strong>Print / Save PDF</strong> or use Ctrl+P / Cmd+P</li>
            <li>Select &quot;Save as PDF&quot; as the destination</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
