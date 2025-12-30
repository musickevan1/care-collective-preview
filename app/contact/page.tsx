import { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Shield, MessageCircle } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

export const metadata = {
  title: 'Contact Us - CARE Collective',
  description: 'Get in touch with the CARE Collective team for questions, concerns, or support.',
};

export default function ContactPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-br from-sage to-sage-dark rounded-full shadow-lg mb-4">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            We&apos;re here to help. Reach out with any questions, concerns, or feedback.
          </p>
        </div>

        {/* Primary Contact */}
        <section className="mb-8">
          <Card className="border-sage/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-sage hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-sage/10 rounded-lg">
                  <Mail className="w-7 h-7 text-sage" />
                </div>
                Email Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-lg">
                Send us an email and we&apos;ll get back to you as soon as possible.
              </p>
              <a
                href="mailto:swmocarecollective@gmail.com"
                className="text-2xl font-semibold text-sage hover:text-sage-dark hover:underline transition-colors"
              >
                swmocarecollective@gmail.com
              </a>
            </CardContent>
          </Card>
        </section>

        {/* Response Time */}
        <section className="mb-8">
          <Card className="border-primary/30 bg-gradient-to-br from-white to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-lg">Safety Issues:</span>
                    <span className="text-muted-foreground ml-2">Within 24 hours</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-lg">Other Inquiries:</span>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">How Can We Help?</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-sage/20 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:border-sage hover:-translate-y-1">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2 text-lg">Safety Concerns</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Report any behavior that compromises the safety or trust of our community members.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary hover:-translate-y-1">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2 text-lg">Technical Support</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Need help with your account, passwords, or navigating the platform?
                </p>
              </CardContent>
            </Card>

            <Card className="border-dusty-rose/20 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:border-dusty-rose hover:-translate-y-1">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2 text-lg">General Questions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Questions about how the CARE Collective works or how to get involved?
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:border-accent hover:-translate-y-1">
              <CardContent className="p-6">
                <h3 className="font-bold text-foreground mb-2 text-lg">Feedback & Suggestions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We value your input on how we can improve the platform and better serve our community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
