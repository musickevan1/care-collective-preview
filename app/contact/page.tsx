import { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Shield, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Contact Us - Care Collective',
  description: 'Get in touch with the CARE Collective team for questions, concerns, or support.',
};

export default function ContactPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Button asChild variant="default" size="sm">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-sage" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            We&apos;re here to help. Reach out with any questions, concerns, or feedback.
          </p>
        </div>

        {/* Primary Contact */}
        <section className="mb-8">
          <Card className="border-sage/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-sage" />
                Email Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Send us an email and we&apos;ll get back to you as soon as possible.
              </p>
              <a
                href="mailto:swmocarecollective@gmail.com"
                className="text-2xl font-semibold text-sage hover:underline"
              >
                swmocarecollective@gmail.com
              </a>
            </CardContent>
          </Card>
        </section>

        {/* Response Time */}
        <section className="mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Safety Issues:</span>
                    <span className="text-muted-foreground ml-2">Within 24 hours</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Other Inquiries:</span>
                    <span className="text-muted-foreground ml-2">Within 2-3 business days</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Contact Form */}
        <section className="mb-12">
          <ContactForm />
        </section>

        {/* What to Contact Us About */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How Can We Help?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">Safety Concerns</h3>
                <p className="text-sm text-muted-foreground">
                  Report any behavior that compromises the safety or trust of our community members.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">Technical Support</h3>
                <p className="text-sm text-muted-foreground">
                  Need help with your account, passwords, or navigating the platform?
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">General Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Questions about how the CARE Collective works or how to get involved?
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">Feedback & Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  We value your input on how we can improve the platform and better serve our community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
