import { ReactElement, useState } from 'react'

interface DiagnosticData {
  authUserId: string
  authUserEmail: string
  profileId: string
  profileName: string
  profileStatus: string
  idsMatch: boolean
  timestamp: string
}

/**
 * Diagnostic panel for debugging authentication issues
 * Shows real-time data from auth session and database queries
 *
 * TEMPORARY: Remove after bug is fixed
 *
 * This panel displays critical authentication data to identify where
 * the auth bug occurs without needing access to Vercel runtime logs.
 */
export function DiagnosticPanel({ data }: { data: DiagnosticData }): ReactElement | null {
  const [isVisible, setIsVisible] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('diagnosticPanelClosed') !== 'true' : true;
  })

  const handleClose = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('diagnosticPanelClosed', 'true');
    }
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 text-xs font-mono z-50 shadow-lg border-t-4 border-yellow-400">
      <div className="max-w-7xl mx-auto">
        <div className="font-bold text-yellow-300 mb-2 text-center flex items-center justify-center">
          🚨 DIAGNOSTIC MODE - Auth Debug Panel 🚨
          <button
            onClick={handleClose}
            className="ml-auto bg-yellow-400 hover:bg-yellow-500 text-red-600 rounded px-2 py-1 font-bold text-sm transition-colors"
            aria-label="Close diagnostic panel"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="font-bold text-yellow-300">Auth User ID:</div>
            <div className="truncate text-xs" title={data.authUserId}>
              {data.authUserId.substring(0, 8)}...
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Auth Email:</div>
            <div className="truncate">{data.authUserEmail}</div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Profile ID:</div>
            <div className="truncate text-xs" title={data.profileId}>
              {data.profileId.substring(0, 8)}...
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Profile Name:</div>
            <div className="font-bold text-lg">{data.profileName}</div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">Status:</div>
            <div className={
              data.profileStatus === 'rejected' ? 'text-red-300 font-bold' :
              data.profileStatus === 'approved' ? 'text-green-300 font-bold' :
              'text-yellow-300'
            }>
              {data.profileStatus.toUpperCase()}
            </div>
          </div>
          <div>
            <div className="font-bold text-yellow-300">IDs Match:</div>
            <div className={data.idsMatch ? 'text-green-300 font-bold' : 'text-red-300 font-bold text-lg'}>
              {data.idsMatch ? '✓ YES' : '✗ NO MISMATCH!'}
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-yellow-200 text-xs">
          Full Auth ID: {data.authUserId} | Full Profile ID: {data.profileId} | {data.timestamp}
        </div>
      </div>
    </div>
  )
}
