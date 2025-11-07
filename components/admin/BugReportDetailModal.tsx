'use client';

import { ReactElement, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical';

interface BugReport {
  id: string;
  user_id: string;
  title: string;
  severity: BugReportSeverity;
  category: string;
  description: string;
  steps_to_reproduce: string | null;
  context: {
    url: string;
    userAgent: string;
    screenSize: string;
    viewport: string;
    timestamp: string;
  };
  reporter_name: string | null;
  reporter_email: string | null;
  is_from_beta_tester: boolean;
  status: BugReportStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface BugReportDetailModalProps {
  report: BugReport;
  onClose: () => void;
  onUpdate: () => void;
}

export function BugReportDetailModal({
  report,
  onClose,
  onUpdate,
}: BugReportDetailModalProps): ReactElement {
  const [status, setStatus] = useState<BugReportStatus>(report.status);
  const [resolutionNotes, setResolutionNotes] = useState(report.resolution_notes || '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch('/api/beta/bug-report', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: report.id,
          status,
          resolutionNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update bug report');
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bug report');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-secondary">Bug Report Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-semibold text-secondary">{report.title}</h3>
              {report.is_from_beta_tester && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-300">
                  Beta Tester
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-text/70">Reporter:</span>{' '}
                <span className="text-secondary">
                  {report.reporter_name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium text-text/70">Email:</span>{' '}
                <span className="text-secondary">
                  {report.reporter_email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-text/70">Category:</span>{' '}
                <span className="text-secondary capitalize">{report.category}</span>
              </div>
              <div>
                <span className="font-medium text-text/70">Severity:</span>{' '}
                <span className={`font-semibold capitalize ${
                  report.severity === 'critical' ? 'text-red-600' :
                  report.severity === 'high' ? 'text-orange-600' :
                  report.severity === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {report.severity}
                </span>
              </div>
              <div>
                <span className="font-medium text-text/70">Created:</span>{' '}
                <span className="text-secondary">
                  {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div>
                <span className="font-medium text-text/70">Updated:</span>{' '}
                <span className="text-secondary">
                  {format(new Date(report.updated_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-secondary mb-2">Description</h4>
            <p className="text-text bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* Steps to Reproduce */}
          {report.steps_to_reproduce && (
            <div>
              <h4 className="font-semibold text-secondary mb-2">Steps to Reproduce</h4>
              <p className="text-text bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                {report.steps_to_reproduce}
              </p>
            </div>
          )}

          {/* Context */}
          <div>
            <h4 className="font-semibold text-secondary mb-2">Technical Context</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div>
                <span className="font-medium text-text/70">URL:</span>{' '}
                <a
                  href={report.context.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sage hover:underline"
                >
                  {report.context.url}
                </a>
              </div>
              <div>
                <span className="font-medium text-text/70">User Agent:</span>{' '}
                <span className="text-text/80 break-all">{report.context.userAgent}</span>
              </div>
              <div>
                <span className="font-medium text-text/70">Screen Size:</span>{' '}
                <span className="text-text/80">{report.context.screenSize}</span>
              </div>
              <div>
                <span className="font-medium text-text/70">Viewport:</span>{' '}
                <span className="text-text/80">{report.context.viewport}</span>
              </div>
              <div>
                <span className="font-medium text-text/70">Timestamp:</span>{' '}
                <span className="text-text/80">
                  {format(new Date(report.context.timestamp), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-secondary mb-4">Update Status</h4>

            <div className="space-y-4">
              <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-text mb-2">
                  Status
                </label>
                <select
                  id="status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BugReportStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
              </div>

              <div>
                <label htmlFor="resolution-notes" className="block text-sm font-medium text-text mb-2">
                  Resolution Notes
                </label>
                <textarea
                  id="resolution-notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about the resolution or progress..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </div>
          </div>

          {/* Resolution Info (if resolved) */}
          {report.resolved_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Resolved</h4>
              <p className="text-sm text-green-700 mb-1">
                Resolved on {format(new Date(report.resolved_at), 'MMM d, yyyy h:mm a')}
              </p>
              {report.resolution_notes && (
                <p className="text-sm text-green-700 mt-2">
                  <span className="font-medium">Notes:</span> {report.resolution_notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
