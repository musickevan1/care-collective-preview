'use client'

import { ReactElement } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminReportingDashboard } from '@/components/admin/AdminReportingDashboard'

export default function AdminReportsPage(): ReactElement {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href="/admin" className="inline-block">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Admin Reports & Analytics</h1>
              <p className="text-xs sm:text-sm text-secondary-foreground/70">
                Comprehensive community insights and operational metrics
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Admin Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-1 sm:mb-2">
            📈 Comprehensive Analytics Dashboard
          </h2>
          <p className="text-sm sm:text-base text-blue-800">
            Monitor community health, track administrative actions, and export data for analysis and compliance.
          </p>
        </div>

        {/* Reporting Dashboard */}
        <AdminReportingDashboard />
      </div>
    </main>
  )
}