'use client';

import { ReactElement, useState, useEffect } from 'react';
import { BugReportDetailModal } from './BugReportDetailModal';
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

export function BugReportsList(): ReactElement {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [betaFilter, setBetaFilter] = useState<string>('');

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (betaFilter) params.append('beta', betaFilter);

      const response = await fetch(`/api/beta/bug-report?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bug reports');
      }

      const data = await response.json();
      setBugReports(data.bugReports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugReports();
  }, [statusFilter, severityFilter, betaFilter]);

  const getSeverityColor = (severity: BugReportSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: BugReportStatus): string => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'wont_fix':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sage border-r-transparent mb-4"></div>
          <p className="text-text/70">Loading bug reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold">Error loading bug reports</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchBugReports}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="font-semibold text-secondary mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-text mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity-filter" className="block text-sm font-medium text-text mb-2">
              Severity
            </label>
            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="beta-filter" className="block text-sm font-medium text-text mb-2">
              Source
            </label>
            <select
              id="beta-filter"
              value={betaFilter}
              onChange={(e) => setBetaFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="">All Users</option>
              <option value="true">Beta Testers Only</option>
              <option value="false">Non-Beta Users Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text/70">
          {bugReports.length} {bugReports.length === 1 ? 'report' : 'reports'} found
        </p>
        <button
          onClick={fetchBugReports}
          className="text-sm text-sage hover:text-sage-dark underline"
        >
          Refresh
        </button>
      </div>

      {/* Bug reports list */}
      {bugReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-text/70">No bug reports found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-secondary truncate">
                      {report.title}
                    </h3>
                    {report.is_from_beta_tester && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-300">
                        Beta
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text/70 line-clamp-2 mb-3">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md border font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-md border font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-text/60">
                      {report.category}
                    </span>
                    <span className="text-text/60">
                      by {report.reporter_name || 'Unknown'}
                    </span>
                    <span className="text-text/60">
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedReport && (
        <BugReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdate={fetchBugReports}
        />
      )}
    </div>
  );
}
