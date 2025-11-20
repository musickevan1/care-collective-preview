/**
 * @fileoverview Public Privacy Policy Page
 * Publicly accessible privacy policy without authentication requirement
 */

import { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - CARE Collective',
  description: 'Privacy Policy for the CARE Collective mutual aid platform. Learn how we protect your data and privacy.',
};

export default function PrivacyPolicyPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last Updated: January 2025
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-sage/30 bg-sage/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-sage flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Privacy Matters</h3>
                <p className="text-foreground">
                  The CARE Collective is committed to protecting your privacy and personal information.
                  This policy explains how we collect, use, and safeguard your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1. Information We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-sage" />
            1. Information We Collect
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Account Information</h3>
              <p className="text-foreground">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Name</li>
                <li>Email address</li>
                <li>General location (city/region)</li>
                <li>Password (encrypted)</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-4">Platform Activity</h3>
              <p className="text-foreground">
                As you use the platform, we collect:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Help requests you post</li>
                <li>Messages you send to other members</li>
                <li>Your responses to help requests</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-4">Technical Information</h3>
              <p className="text-foreground">
                We automatically collect certain technical data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Usage patterns and navigation data</li>
                <li>Login timestamps</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-dusty-rose" />
            2. How We Use Your Information
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Operate and maintain the CARE Collective platform</li>
                <li>Connect you with community members for mutual aid</li>
                <li>Facilitate secure messaging between members</li>
                <li>Send important platform updates and notifications</li>
                <li>Improve the platform and develop new features</li>
                <li>Monitor for safety and prevent misuse</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="text-foreground mt-4 font-semibold">
                We will never sell your personal information to third parties.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 3. Contact Information Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            3. Contact Information Sharing
          </h2>
          <Card className="border-primary/30">
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground font-semibold">
                Your contact information is NEVER shared publicly.
              </p>
              <p className="text-foreground">
                Contact information (email, phone) is only shared when:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>You explicitly choose to offer help on a request</li>
                <li>You accept help from another member</li>
                <li>Both parties have consented to the connection</li>
              </ul>
              <p className="text-foreground mt-4">
                You maintain full control over when and how your contact information is shared.
                You can manage your privacy settings from your{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Dashboard</Link>
                {' '}(requires login).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 4. Data Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-sage" />
            4. Data Security
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password storage with hashing</li>
                <li>Regular security updates and monitoring</li>
                <li>Access controls and authentication</li>
                <li>Secure database infrastructure</li>
              </ul>
              <p className="text-foreground mt-4">
                While we take extensive precautions, no system is 100% secure. We encourage you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Use a strong, unique password</li>
                <li>Never share your login credentials</li>
                <li>Log out when using shared devices</li>
                <li>Report any suspicious activity immediately</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 5. Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We retain your personal information only as long as necessary to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Provide you with platform services</li>
                <li>Maintain accurate records for safety and accountability</li>
                <li>Comply with legal requirements</li>
              </ul>
              <p className="text-foreground mt-4">
                If you close your account, we will delete or anonymize your personal information within
                30 days, except where we&apos;re required to retain certain data for legal or safety purposes.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 6. Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Privacy Rights</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Access the personal information we have about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of non-essential communications</li>
                <li>Export your data in a portable format</li>
                <li>Control how your contact information is shared</li>
              </ul>
              <p className="text-foreground mt-4">
                To exercise these rights, visit your{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Dashboard</Link>
                {' '}or contact us at{' '}
                <a href="mailto:swmocarecollective@gmail.com" className="text-primary hover:underline">
                  swmocarecollective@gmail.com
                </a>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 7. Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">7. Third-Party Services</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                The CARE Collective uses the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li><strong>Supabase:</strong> Authentication and database hosting</li>
                <li><strong>Vercel:</strong> Website hosting and deployment</li>
              </ul>
              <p className="text-foreground mt-4">
                These services have their own privacy policies and security measures. We carefully
                select partners who prioritize data protection and privacy.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 8. Children's Privacy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">8. Children&apos;s Privacy</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                The CARE Collective is not intended for use by individuals under 18 years of age.
                We do not knowingly collect personal information from children. If we learn that
                we have collected information from a child under 18, we will delete it promptly.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 9. Changes to Privacy Policy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to This Policy</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                We may update this Privacy Policy from time to time. When we make significant changes,
                we will:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                <li>Update the &quot;Last Updated&quot; date at the top</li>
                <li>Notify active users via email or platform notification</li>
                <li>Post the updated policy on this page</li>
              </ul>
              <p className="text-foreground mt-4">
                Your continued use of the platform after changes are posted constitutes acceptance
                of the updated policy.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 10. Contact Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-primary" />
            10. Questions and Concerns
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground">
                If you have questions about this Privacy Policy or how we handle your data, please contact:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-foreground font-semibold">CARE Collective Privacy Officer</p>
                <p className="text-muted-foreground">Dr. Maureen Templeman</p>
                <p className="text-muted-foreground">Missouri State University</p>
                <p className="text-muted-foreground mt-2">
                  Email:{' '}
                  <a href="mailto:swmocarecollective@gmail.com" className="text-primary hover:underline">
                    swmocarecollective@gmail.com
                  </a>
                </p>
                <p className="text-muted-foreground mt-2">
                  Visit our{' '}
                  <Link href="/contact" className="text-primary hover:underline">Contact page</Link>
                  {' '}for more information
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Acknowledgment */}
        <Card className="mb-8 border-sage/30 bg-sage/5">
          <CardContent className="p-6">
            <p className="text-foreground">
              By using the CARE Collective, you acknowledge that you have read and understood this
              Privacy Policy and agree to our data practices as described.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/terms"
            className="text-primary hover:underline text-sm"
          >
            Read Terms of Service
          </Link>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <Link
            href="/privacy"
            className="text-primary hover:underline text-sm"
          >
            Manage Privacy Settings
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
