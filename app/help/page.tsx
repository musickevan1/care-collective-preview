/**
 * @fileoverview Help and support page for CARE Collective users
 * Redesigned for visual consistency with warm, organic aesthetics
 */

import { ReactElement } from 'react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { SectionHeader } from '@/components/public/SectionHeader';
import { InfoCard } from '@/components/public/InfoCard';
import { ActionCard } from '@/components/public/ActionCard';
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Users,
  Heart,
  Shield,
  Lock,
  Mail,
  HandHeart,
  Sparkles
} from 'lucide-react';

export default function HelpPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* Page Header - Matching homepage style */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-sage rounded-2xl shadow-lg shadow-sage/20 mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-[clamp(32px,5vw,48px)] font-bold text-brown uppercase tracking-wide mb-4">
            Help & Support
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            We&apos;re here to help you connect with your community safely and effectively.
            Find answers, learn how to use the platform, and get support when you need it.
          </p>
        </header>

        {/* Getting Started Section */}
        <section className="mb-16">
          <SectionHeader
            title="Getting Started"
            description="New to CARE Collective? Here's everything you need to know to begin your journey."
            icon={<Sparkles className="w-7 h-7 text-white" />}
            iconBgColor="sage"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <ActionCard
              title="Create Your Profile"
              description="Set up your profile to connect with other caregivers in your area. Share your experience and what kind of support you're looking for."
              icon={<Users className="w-6 h-6" />}
              iconBgColor="sage"
              actionLabel="Get Started"
              actionHref="/signup"
            />

            <ActionCard
              title="Browse Help Requests"
              description="See what your fellow caregivers need help with. You might be able to offer just the support they're looking for."
              icon={<Heart className="w-6 h-6" />}
              iconBgColor="dusty-rose"
              actionLabel="View Requests"
              actionHref="/requests"
            />

            <ActionCard
              title="Post a Help Request"
              description="Need support? Create a request and let your community know how they can help you. It's okay to ask."
              icon={<HandHeart className="w-6 h-6" />}
              iconBgColor="primary"
              actionLabel="Create Request"
              actionHref="/requests/new"
            />

            <ActionCard
              title="Send Messages"
              description="Connect privately with other caregivers through our secure messaging system. Coordinate help and build relationships."
              icon={<MessageCircle className="w-6 h-6" />}
              iconBgColor="accent"
              actionLabel="Open Messages"
              actionHref="/messages"
            />
          </div>
        </section>

        {/* Platform Guide Section */}
        <section className="mb-16">
          <SectionHeader
            title="Platform Guide"
            description="Learn how to make the most of CARE Collective's features."
            icon={<BookOpen className="w-7 h-7 text-white" />}
            iconBgColor="primary"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="How Help Requests Work"
              description="Help requests are the heart of CARE Collective. Here's how the process works from start to finish."
              icon={<HelpCircle className="w-6 h-6" />}
              iconBgColor="sage"
              items={[
                "Post a request describing what you need",
                "Community members see your request and can offer help",
                "Connect via messages to coordinate details",
                "Mark as complete when you've received support"
              ]}
            />

            <InfoCard
              title="Messaging Best Practices"
              description="Tips for effective and respectful communication with other caregivers."
              icon={<MessageCircle className="w-6 h-6" />}
              iconBgColor="primary"
              items={[
                "Be clear about what help you can offer or need",
                "Respond promptly when possible",
                "Share only information you're comfortable with",
                "Be understanding of others' caregiving schedules"
              ]}
            />
          </div>
        </section>

        {/* Safety & Privacy Section */}
        <section className="mb-16">
          <SectionHeader
            title="Safety & Privacy"
            description="Your safety and privacy are our top priorities. Here's how we protect you."
            icon={<Shield className="w-7 h-7 text-white" />}
            iconBgColor="dusty-rose"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="Community Guidelines"
              description="Our shared values that keep our community safe and supportive for everyone."
              icon={<Heart className="w-6 h-6" />}
              iconBgColor="dusty-rose"
              items={[
                "Treat everyone with kindness and respect",
                "Honor your commitments to fellow caregivers",
                "Keep shared information confidential",
                "Report any concerns to our support team"
              ]}
            />

            <InfoCard
              title="Privacy Protection"
              description="How we keep your personal information safe and in your control."
              icon={<Lock className="w-6 h-6" />}
              iconBgColor="sage"
              items={[
                "Your contact info is never shared publicly",
                "You control what information others can see",
                "Messages are private between participants",
                "You can delete your data at any time"
              ]}
            />

            <ActionCard
              title="Report a Concern"
              description="If you ever feel unsafe or witness behavior that doesn't align with our values, please let us know. We take every report seriously."
              icon={<Shield className="w-6 h-6" />}
              iconBgColor="dusty-rose"
              actionLabel="Contact Support"
              actionHref="/contact"
            />

            <ActionCard
              title="Privacy Settings"
              description="Review and manage your privacy preferences. You're always in control of your personal information."
              icon={<Lock className="w-6 h-6" />}
              iconBgColor="sage"
              actionLabel="Manage Settings"
              actionHref="/privacy"
            />
          </div>
        </section>

        {/* Contact Support Section */}
        <section>
          <SectionHeader
            title="Need More Help?"
            description="Can't find what you're looking for? Our support team is here for you."
            icon={<Mail className="w-7 h-7 text-white" />}
            iconBgColor="accent"
          />

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border-2 border-accent/20 shadow-lg p-8 md:p-10 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-accent/10 rounded-2xl mb-6">
                <Mail className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Email Our Support Team
              </h3>
              <p className="text-foreground/70 mb-6 max-w-md mx-auto">
                We respond to safety concerns within 24 hours and other inquiries within 2-3 business days.
              </p>
              <a
                href="mailto:swmocarecollective@gmail.com"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-foreground rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 min-h-[48px]"
              >
                <Mail className="w-5 h-5" />
                swmocarecollective@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}

export const metadata = {
  title: 'Help & Support - CARE Collective',
  description: 'Get help using the CARE Collective platform. Find guides, safety information, and contact support.'
};
