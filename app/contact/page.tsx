/**
 * @fileoverview Contact page for CARE Collective
 * Redesigned with warm, organic aesthetics and consistent patterns
 */

import { ReactElement } from 'react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { SectionHeader } from '@/components/public/SectionHeader';
import { ActionCard } from '@/components/public/ActionCard';
import { ContactForm } from '@/components/ContactForm';
import {
  Mail,
  Clock,
  Shield,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Phone,
  AlertTriangle
} from 'lucide-react';

export const metadata = {
  title: 'Contact Us - CARE Collective',
  description: 'Get in touch with the CARE Collective team for questions, concerns, or support.',
};

export default function ContactPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        {/* Page Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-sage rounded-2xl shadow-lg shadow-sage/20 mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-[clamp(32px,5vw,48px)] font-bold text-brown uppercase tracking-wide mb-4">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            We&apos;re here to help. Reach out with questions, concerns, or feedback.
            Your voice matters to our community.
          </p>
        </header>

        {/* Quick Contact Cards */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Card */}
            <div className="bg-white rounded-2xl border-2 border-sage/20 shadow-lg hover:shadow-xl hover:border-sage transition-all duration-500 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-sage rounded-xl shadow-lg shadow-sage/20">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Email Us</h2>
                  <p className="text-foreground/70">Best for general inquiries</p>
                </div>
              </div>
              <a
                href="mailto:swmocarecollective@gmail.com"
                className="text-lg md:text-xl font-semibold text-sage hover:text-sage-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sage/50 rounded inline-block"
              >
                swmocarecollective@gmail.com
              </a>
            </div>

            {/* Response Time Card */}
            <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-lg p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Response Times</h2>
                  <p className="text-foreground/70">When to expect a reply</p>
                </div>
              </div>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-dusty-rose flex-shrink-0" />
                  <span><strong>Safety issues:</strong> Within 24 hours</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-sage flex-shrink-0" />
                  <span><strong>General inquiries:</strong> 2-3 business days</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How Can We Help Section */}
        <section className="mb-16">
          <SectionHeader
            title="How Can We Help?"
            description="Select the type of inquiry that best matches your needs."
            icon={<HelpCircle className="w-7 h-7 text-white" />}
            iconBgColor="primary"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <ActionCard
              title="Safety Concerns"
              description="Report any behavior that compromises the safety or trust of our community. We take every report seriously and respond within 24 hours."
              icon={<Shield className="w-6 h-6" />}
              iconBgColor="dusty-rose"
              actionLabel="Report Safety Issue"
              actionHref="mailto:swmocarecollective@gmail.com?subject=Safety%20Concern"
            />

            <ActionCard
              title="Technical Support"
              description="Need help with your account, password, or navigating the platform? We're here to assist with any technical difficulties."
              icon={<HelpCircle className="w-6 h-6" />}
              iconBgColor="sage"
              actionLabel="Get Tech Help"
              actionHref="/help"
            />

            <ActionCard
              title="General Questions"
              description="Questions about how CARE Collective works, membership, or how to get involved? We'd love to hear from you."
              icon={<MessageCircle className="w-6 h-6" />}
              iconBgColor="primary"
              actionLabel="Ask a Question"
              actionHref="mailto:swmocarecollective@gmail.com?subject=General%20Question"
            />

            <ActionCard
              title="Feedback & Suggestions"
              description="Your input helps us improve. Share ideas about how we can better serve our caregiver community."
              icon={<Sparkles className="w-6 h-6" />}
              iconBgColor="accent"
              actionLabel="Share Feedback"
              actionHref="mailto:swmocarecollective@gmail.com?subject=Feedback"
            />
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-16">
          <SectionHeader
            title="Send Us a Message"
            description="Fill out the form below and we'll get back to you as soon as possible."
            icon={<Mail className="w-7 h-7 text-white" />}
            iconBgColor="sage"
          />
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </section>

        {/* Crisis Resources Banner */}
        <section>
          <div className="bg-dusty-rose/10 border-2 border-dusty-rose/30 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-dusty-rose rounded-xl shadow-lg shadow-dusty-rose/20 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  In Crisis or Need Immediate Support?
                </h3>
                <p className="text-foreground/70 mb-4">
                  If you&apos;re experiencing a mental health crisis or need immediate support,
                  please reach out to these resources:
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="tel:988"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dusty-rose text-white rounded-lg font-semibold hover:bg-dusty-rose-dark transition-colors min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    988 Suicide & Crisis Lifeline
                  </a>
                  <a
                    href="tel:211"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-dusty-rose text-dusty-rose rounded-lg font-semibold hover:bg-dusty-rose/10 transition-colors min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    211 Community Resources
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
