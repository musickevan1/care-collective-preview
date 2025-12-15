import { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, FileText, Scale, Heart } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - CARE Collective',
  description: 'Terms of Service and user agreement for the CARE Collective mutual assistance platform.',
};

export default function TermsPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: January 2025
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Important Notice</h3>
                <p className="text-foreground">
                  Please read these Terms of Service carefully before using the CARE Collective platform.
                  By creating an account and using our services, you agree to be bound by these terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1. Acceptance of Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sage" />
            1. Acceptance of Terms
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                By accessing or using the CARE Collective website and services, you agree to be bound by
                these Terms of Service and our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                If you do not agree to these terms, you may not access or use our services.
              </p>
              <p className="text-foreground">
                These terms apply to all users of the platform, including those who browse, post help requests,
                offer assistance, or communicate through our messaging system.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 2. Service Description */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">2. Service Description</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                The CARE Collective is a mutual assistance platform that connects family caregivers in Southwest Missouri
                for the exchange of practical help, shared resources, and support. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Creating and responding to help requests</li>
                <li>Secure messaging between members</li>
                <li>Resource sharing and community information</li>
                <li>Community events and learning opportunities</li>
              </ul>
              <p className="text-foreground">
                The CARE Collective serves as a facilitator and platform provider only. We do not provide
                caregiving services directly, nor do we employ or control the actions of our members.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 3. User Accounts and Responsibilities */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts and Responsibilities</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Account Creation</h3>
              <p className="text-foreground">
                To use the CARE Collective, you must create an account and provide accurate, complete information.
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account.
              </p>

              <h3 className="font-semibold text-foreground mt-4">Eligibility</h3>
              <p className="text-foreground">
                You must be at least 18 years old to use this service. By creating an account, you represent that
                you meet this age requirement and that all information you provide is accurate.
              </p>

              <h3 className="font-semibold text-foreground mt-4">Your Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Maintain accurate and up-to-date account information</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Use the platform only for its intended purpose of mutual assistance among caregivers</li>
                <li>Follow all applicable laws and regulations</li>
                <li>Respect the rights and dignity of other members</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 4. Community Standards */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">4. Community Standards</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">Members of the CARE Collective agree to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Treat all caregivers with respect and avoid judgment or discrimination based on their situations,
                    choices, or circumstances.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Keep all shared information confidential and use member contact details only for
                    CARE Collective exchanges.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Honor commitments by communicating promptly if plans change or you&apos;re unable to
                    follow through on an exchange.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Respect each caregiver&apos;s limits around time, energy, and the type of support they
                    can give or receive.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Use the platform only to give or receive caregiving help and use good judgment about
                    safety when meeting or exchanging with members.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-sage mt-1 flex-shrink-0" />
                  <span className="text-foreground">
                    Avoid harassment or any behavior that undermines the safety or trust of the community.
                  </span>
                </li>
              </ul>
              <p className="text-foreground mt-4">
                Violation of these standards may result in account suspension or termination.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 5. Liability Disclaimer */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" />
            5. Liability Disclaimer
          </h2>
          <Card className="border-primary/30">
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground font-semibold">
                IMPORTANT: Please read this section carefully.
              </p>
              <p className="text-foreground">
                The CARE Collective provides a platform for community members to connect and coordinate mutual assistance.
                We do not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Verify the identity, qualifications, or background of members</li>
                <li>Supervise, direct, or control any interactions between members</li>
                <li>Guarantee the quality, safety, or legality of any help provided</li>
                <li>Assume responsibility for disputes, injuries, or damages arising from member interactions</li>
              </ul>
              <p className="text-foreground mt-4 font-semibold">
                By using this platform, you acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>All interactions are at your own risk</li>
                <li>You are responsible for your own safety and the safety of those in your care</li>
                <li>You will use good judgment when requesting or offering help</li>
                <li>The CARE Collective is not liable for any harm, injury, or damage resulting from member interactions</li>
              </ul>
              <p className="text-foreground mt-4">
                We strongly encourage members to meet in public places, verify identities, and use common sense
                safety precautions when coordinating help.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 6. Privacy and Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sage" />
            6. Privacy and Data
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We take your privacy seriously. Your contact information is never shared publicly, and we only
                facilitate contact sharing when you explicitly choose to offer or accept help.
              </p>
              <p className="text-foreground">
                For complete information about how we collect, use, and protect your data, please review our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
              <p className="text-foreground">
                By using the CARE Collective, you consent to our data practices as described in the Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 7. Prohibited Uses */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Prohibited Uses</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">You may not use the CARE Collective to:</p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Harass, threaten, or intimidate other members</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Solicit donations or sell products or services</li>
                <li>Share spam, malware, or malicious links</li>
                <li>Violate any local, state, or federal laws</li>
                <li>Infringe on intellectual property rights</li>
                <li>Collect personal information from other users without consent</li>
                <li>Impersonate another person or entity</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 8. Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">8. Intellectual Property</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                The CARE Collective platform, including its design, code, content, and branding, is owned by
                CARE Collective. The platform is developed in partnership with Missouri State University.
                Unauthorized use, reproduction, or distribution of any materials is prohibited.
              </p>
              <p className="text-foreground">
                You retain ownership of content you post (such as help request descriptions), but grant us a
                license to display and use this content to operate and improve the platform.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 9. Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">9. Account Termination</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We reserve the right to suspend or terminate your account if you violate these Terms of Service
                or engage in behavior that compromises the safety or trust of the community.
              </p>
              <p className="text-foreground">
                You may also close your account at any time by contacting the administrator. Upon account closure,
                your personal information will be handled according to our Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 10. Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">10. Changes to These Terms</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We may update these Terms of Service from time to time. When we make changes, we will update
                the &quot;Last Updated&quot; date at the top of this page and notify active users via email or
                platform notification.
              </p>
              <p className="text-foreground">
                Your continued use of the platform after changes are posted constitutes acceptance of the
                updated terms.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 11. Dispute Resolution */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">11. Dispute Resolution</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                If you have a dispute with another member, we encourage you to resolve it directly and amicably.
                If you have concerns about safety or conduct, please contact the administrator immediately.
              </p>
              <p className="text-foreground">
                These Terms of Service are governed by the laws of the State of Missouri, United States.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 12. Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Information</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                If you have questions about these Terms of Service or need to report a concern, please contact:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-foreground font-semibold">CARE Collective Administrator</p>
                <p className="text-muted-foreground">Dr. Maureen Templeman</p>
                <p className="text-muted-foreground">Missouri State University</p>
                <p className="text-muted-foreground">
                  Visit our <Link href="/contact" className="text-primary hover:underline">Contact page</Link> for more information
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Acknowledgment */}
        <Card className="mb-8 border-sage/30 bg-sage/5">
          <CardContent className="p-6">
            <p className="text-foreground">
              By using the CARE Collective, you acknowledge that you have read, understood, and agree to be
              bound by these Terms of Service and our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/about"
            className="text-primary hover:underline text-sm"
          >
            Read Our Community Standards
          </Link>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <Link
            href="/privacy-policy"
            className="text-primary hover:underline text-sm"
          >
            View Privacy Policy
          </Link>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <Link
            href="/"
            className="text-primary hover:underline text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
