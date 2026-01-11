import { type ReactElement } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { PublicPageLayout } from '@/components/layout/PublicPageLayout'
import { WaiverContent } from '@/components/legal'

export const metadata = {
  title: 'Community Safety Guidelines & Liability Waiver | CARE Collective',
  description: 'Review the CARE Collective Community Safety Guidelines and Liability Waiver before joining our mutual aid community.',
}

export default function WaiverPreviewPage(): ReactElement {
  return (
    <PublicPageLayout showFooter={true}>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Back Link */}
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sage hover:text-sage-dark mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage/10 rounded-full mb-4">
            <FileText className="w-8 h-8 text-sage" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Community Safety Guidelines & Liability Waiver
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Please review these guidelines carefully. By joining CARE Collective,
            you acknowledge and agree to the following terms.
          </p>
        </div>

        {/* Waiver Content Card */}
        <div className="bg-white rounded-2xl border-2 border-sage/20 shadow-lg p-6 md:p-8 mb-8">
          <p className="text-sm text-muted-foreground mb-6 pb-4 border-b border-sage/10">
            By joining the CARE Collective, I acknowledge and agree to the following:
          </p>

          <WaiverContent className="text-foreground" />
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to join our community? You will be asked to sign this waiver
            when completing your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-sage text-white font-medium rounded-lg hover:bg-sage-dark transition-colors min-h-[44px]"
            >
              Continue to Sign Up
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-sage/30 text-sage font-medium rounded-lg hover:bg-sage/5 transition-colors min-h-[44px]"
            >
              Learn More About Us
            </Link>
          </div>
        </div>

        {/* Document Version */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Document Version 1.0 | Last Updated: January 2026
          </p>
        </div>
      </div>
    </PublicPageLayout>
  )
}
