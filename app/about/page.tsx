/**
 * @fileoverview About page for CARE Collective
 * Polished for visual consistency with warm, organic aesthetics
 */

import { ReactElement } from 'react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { SectionHeader } from '@/components/public/SectionHeader';
import { InfoCard } from '@/components/public/InfoCard';
import { CTAButton } from '@/components/public/CTAButton';
import {
  Heart,
  Users,
  Sparkles,
  Handshake,
  Target,
  Shield,
  Info,
  GraduationCap,
  CheckCircle
} from 'lucide-react';

export const metadata = {
  title: 'About Us - CARE Collective',
  description: 'Learn about the CARE Collective mission, vision, values, and community standards for family caregivers in Southwest Missouri.',
};

export default function AboutPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        {/* Page Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-sage rounded-2xl shadow-lg shadow-sage/20 mb-6">
            <Info className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-[clamp(32px,5vw,48px)] font-bold text-brown uppercase tracking-wide mb-4">
            About CARE Collective
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            A community of family caregivers supporting each other through practical help and shared resources.
          </p>
        </header>

        {/* Mission & Vision - Side by Side */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mission */}
            <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-lg hover:shadow-xl hover:border-primary transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground pt-1">Our Mission</h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed">
                To connect caregivers with one another for the exchange of practical help, shared resources,
                and mutual support.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl border-2 border-sage/20 shadow-lg hover:shadow-xl hover:border-sage transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-sage rounded-xl shadow-lg shadow-sage/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground pt-1">Our Vision</h2>
              </div>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Reimagining caregiving as a collective act of compassion and mutual care that strengthens families
                and communities, supports dignity and well-being in later life, and makes caregiving sustainable for all.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <SectionHeader
            title="Our Values"
            description="The principles that guide everything we do."
            icon={<Heart className="w-7 h-7 text-white" />}
            iconBgColor="dusty-rose"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border-2 border-sage/20 shadow-lg hover:shadow-xl hover:border-sage transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-sage/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-sage" />
                </div>
                <h3 className="text-xl font-bold text-foreground pt-1">Empowerment</h3>
              </div>
              <p className="text-foreground/70 leading-relaxed">
                We build this collective by voicing our needs, cultivating confidence and growth,
                and shaping the support that works for us.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-lg hover:shadow-xl hover:border-primary transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground pt-1">Compassion</h3>
              </div>
              <p className="text-foreground/70 leading-relaxed">
                We act with kindness and empathy, honoring the dignity of caregivers and those they care for.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-dusty-rose/20 shadow-lg hover:shadow-xl hover:border-dusty-rose transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-dusty-rose/10 rounded-xl">
                  <Handshake className="w-6 h-6 text-dusty-rose" />
                </div>
                <h3 className="text-xl font-bold text-foreground pt-1">Reciprocity</h3>
              </div>
              <p className="text-foreground/70 leading-relaxed">
                We value both giving and receiving support, recognizing that everyone contributes differently
                and all contributions strengthen our community.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-accent/20 shadow-lg hover:shadow-xl hover:border-accent transition-all duration-500 p-6 md:p-8 hover:-translate-y-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground pt-1">Community</h3>
              </div>
              <p className="text-foreground/70 leading-relaxed">
                We foster connections among caregivers and neighbors, creating belonging through
                shared experience and purpose.
              </p>
            </div>
          </div>
        </section>

        {/* Community Standards */}
        <section className="mb-16">
          <SectionHeader
            title="Community Standards"
            description="Our shared agreements for building a safe, supportive community."
            icon={<Shield className="w-7 h-7 text-white" />}
            iconBgColor="sage"
          />

          <div className="space-y-6">
            {/* Our Commitment */}
            <InfoCard
              title="Our Commitment to Each Other"
              description="Members of the CARE Collective agree to uphold these values in all interactions."
              icon={<CheckCircle className="w-6 h-6" />}
              iconBgColor="sage"
              items={[
                "Treat all caregivers with respect and avoid judgment or discrimination",
                "Keep all shared information confidential",
                "Honor commitments and communicate promptly if plans change",
                "Respect each caregiver's limits around time and energy",
                "Use the platform only for caregiving support and practice safety",
                "Avoid harassment or behavior that undermines community trust"
              ]}
            />

            {/* Additional Standards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-primary/5 rounded-2xl border-2 border-primary/20 p-6 md:p-8">
                <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  Terms of Use
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  By joining CARE Collective, you agree to follow these community standards.
                  Membership may be paused or removed if behavior compromises the safety or trust of others.
                </p>
              </div>

              <div className="bg-sage/5 rounded-2xl border-2 border-sage/20 p-6 md:p-8">
                <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-sage" />
                  Background Checks
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  We use <strong>Sterling Volunteers</strong> for background checks (~$19) to help maintain
                  a trusted environment for all members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Partnership */}
        <section className="mb-16">
          <SectionHeader
            title="Academic Partnership"
            description="Research-backed community development."
            icon={<GraduationCap className="w-7 h-7 text-white" />}
            iconBgColor="primary"
          />

          <div className="bg-white rounded-2xl border-2 border-primary/20 shadow-lg p-6 md:p-8">
            <p className="text-lg text-foreground/80 leading-relaxed">
              CARE Collective was developed by <strong>Dr. Maureen Templeman</strong>, Assistant Professor of
              Gerontology at Missouri State University, with support from MSU students and community partners.
              The project is supported by the Department of Sociology, Anthropology, and Gerontology at
              Missouri State University and funded by the <strong>Southern Gerontological Society
              Innovative Projects Grant</strong>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <CTAButton href="/signup">Join Our Community</CTAButton>
        </div>
      </div>
    </PublicPageLayout>
  );
}
