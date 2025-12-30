import { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Sparkles, Handshake } from 'lucide-react';
import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

export const metadata = {
  title: 'About Us - CARE Collective',
  description: 'Learn about the CARE Collective mission, vision, values, and community standards for family caregivers in Southwest Missouri.',
};

export default function AboutPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-gradient-to-r from-sage/10 to-dusty-rose/10 rounded-full mb-4">
            <Heart className="w-12 h-12 text-sage" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About CARE Collective</h1>
        </div>

        {/* Mission */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-contrast rounded-xl shadow-md">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Mission</h2>
          </div>
          <Card className="border-primary/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary hover:-translate-y-1">
            <CardContent className="p-8">
              <p className="text-lg text-foreground leading-relaxed">
                To connect caregivers with one another for the exchange of practical help, shared resources,
                and mutual support.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Vision */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-sage to-sage-dark rounded-xl shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Vision</h2>
          </div>
          <Card className="border-sage/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-sage hover:-translate-y-1">
            <CardContent className="p-8">
              <p className="text-lg text-foreground leading-relaxed">
                Reimagining caregiving as a collective act of compassion and mutual care that strengthens families
                and communities, supports dignity and well-being in later life, and makes caregiving sustainable for all.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-dusty-rose to-dusty-rose-dark rounded-xl shadow-md">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Our Values</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-sage/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-sage hover:-translate-y-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-sage/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-sage" />
                  </div>
                  Empowerment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We build this collective by voicing our needs, cultivating confidence and growth,
                  and shaping the support that works for us.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary hover:-translate-y-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  Compassion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We act with kindness and empathy, honoring the dignity of caregivers and those they care for.
                </p>
              </CardContent>
            </Card>

            <Card className="border-dusty-rose/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-dusty-rose hover:-translate-y-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-dusty-rose/10 rounded-lg">
                    <Handshake className="w-6 h-6 text-dusty-rose" />
                  </div>
                  Reciprocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We value both giving and receiving support, recognizing that everyone contributes differently
                  and all contributions strengthen our community.
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-accent hover:-translate-y-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We foster connections among caregivers and neighbors, creating belonging through
                  shared experience and purpose.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Community Standards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Community Standards</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Our Commitment to Each Other</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Members of the CARE Collective agree to:</p>
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
            </CardContent>
          </Card>

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Terms of Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">
                By joining the CARE Collective, you agree to follow these community standards and use the site
                responsibly. Membership may be paused or removed if behavior compromises the safety or trust of others.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 border-sage/20 bg-sage/5">
            <CardHeader>
              <CardTitle>Background Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">
                To help ensure the safety of our community, we use <strong>Sterling Volunteers</strong> for background checks (approximately $19). This secure service helps us maintain a trusted environment for all members.
              </p>
            </CardContent>
          </Card>

          <Card className="border-sage/20 bg-sage/5">
            <CardHeader>
              <CardTitle>Privacy & Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">
                Your contact information is never shared publicly. If you have any concerns about safety or
                appropriate behavior, contact the CARE Collective administrator.
              </p>
              <p className="text-sm text-muted-foreground">
                We respond to safety issues within 24 hours and other inquiries within 2-3 business days.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Academic Partnership */}
        <section className="mb-12">
          <Card className="bg-background border-muted">
            <CardHeader>
              <CardTitle>Academic Partnership</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                The CARE Collective was developed by <strong>Dr. Maureen Templeman</strong>, Assistant Professor of
                Gerontology at Missouri State University, with support from Missouri State University students and
                community partners. The project is supported by the Department of Sociology, Anthropology, and
                Gerontology at Missouri State University and funded by the Southern Gerontological Society
                Innovative Projects Grant.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl hover:from-sage-dark hover:to-sage text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-sage/30 min-h-[56px]"
          >
            <span>Join Our Community</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}
