'use client';

import { ReactElement, useState } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BugReportFormData {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'functionality' | 'ui' | 'performance' | 'security' | 'content';
  description: string;
  stepsToReproduce: string;
}

export function BugReportButton(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState<BugReportFormData>({
    title: '',
    severity: 'medium',
    category: 'functionality',
    description: '',
    stepsToReproduce: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Capture current page context
      const context = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/beta/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit bug report');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitSuccess(false);
        setFormData({
          title: '',
          severity: 'medium',
          category: 'functionality',
          description: '',
          stepsToReproduce: '',
        });
      }, 2000);
    } catch (error) {
      console.error('Bug report submission error:', error);
      alert('Failed to submit bug report. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Report a bug"
        title="Report a bug or issue"
      >
        <Bug className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">Report Bug</span>
      </button>

      {/* Modal/Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Bug className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-secondary">Report a Bug</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close bug report form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="m-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
                <p className="font-semibold">Thank you for your feedback!</p>
                <p className="text-sm">Your bug report has been submitted successfully.</p>
              </div>
            )}

            {/* Form */}
            {!submitSuccess && (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="bug-title" className="block text-sm font-semibold text-secondary mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bug-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    e.g., "Cannot upload profile picture on mobile"
                  </p>
                </div>

                {/* Severity and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bug-severity" className="block text-sm font-semibold text-secondary mb-2">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="bug-severity"
                      required
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReportFormData['severity'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="low">Low - Minor issue</option>
                      <option value="medium">Medium - Annoying but workable</option>
                      <option value="high">High - Major feature broken</option>
                      <option value="critical">Critical - Blocks testing</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="bug-category" className="block text-sm font-semibold text-secondary mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="bug-category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as BugReportFormData['category'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="functionality">Functionality - Feature doesn&apos;t work</option>
                      <option value="ui">UI/Design - Visual or layout issue</option>
                      <option value="performance">Performance - Slow or laggy</option>
                      <option value="security">Security/Privacy - Data concern</option>
                      <option value="content">Content - Typos or unclear text</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="bug-description" className="block text-sm font-semibold text-secondary mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="bug-description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What happened? What did you expect to happen?"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Include any error messages you saw
                  </p>
                </div>

                {/* Steps to Reproduce */}
                <div>
                  <label htmlFor="bug-steps" className="block text-sm font-semibold text-secondary mb-2">
                    Steps to Reproduce
                  </label>
                  <textarea
                    id="bug-steps"
                    value={formData.stepsToReproduce}
                    onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                    placeholder="1. Go to Browse Requests&#10;2. Click filter dropdown&#10;3. Select 'Groceries'&#10;4. Nothing happens"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Optional but super helpful! List the steps to trigger this bug.
                  </p>
                </div>

                {/* Auto-captured Info Notice */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-700">
                    <strong>Auto-captured:</strong> Page URL, browser/device info, screen size, and timestamp
                    will be included automatically to help us reproduce the issue.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Bug Report
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
