import { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink as ExternalLinkIcon, Heart, Home, Users, GraduationCap, Phone, MessageSquare, Shield } from 'lucide-react';
import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { SectionHeader } from '@/components/public/SectionHeader';
import { CTAButton } from '@/components/public/CTAButton';

export const metadata = {
  title: 'Community Resources - CARE Collective',
  description: 'Trusted local and regional organizations offering practical support, guidance, and connection in Southwest Missouri.',
};

export default function ResourcesPage(): ReactElement {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Community Resources Header - matches homepage style */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-brown text-center uppercase tracking-wide">
              Community Resources
            </h2>
            <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed mb-12">
              The CARE Collective connects community members with trusted local and regional organizations that offer practical support, guidance, and connection.
            </p>
          </div>
        </section>

        {/* Essentials Section */}
        <section className="mb-12">

          <div className="grid gap-6 md:grid-cols-2">
            <ResourceCard
              title="SeniorAge Area Agency on Aging"
              description="Offers meals, transportation, in-home services, and community programs for older adults."
              url="https://senioragemo.org"
            />
            <ResourceCard
              title="Ozarks Food Harvest"
              description="Coordinates food pantries and mobile food distribution across southwest Missouri."
              url="https://ozarksfoodharvest.org"
            />
            <ResourceCard
              title="211 Missouri (United Way)"
              description="Connects to housing, utilities, transportation, and other assistance by phone (call 2-1-1) or online."
              url="https://211helps.org"
            />
            <ResourceCard
              title="Crosslines / Council of Churches of Ozarks"
              description="Coordinates emergency assistance with rent, clothing, and household items."
              url="https://ccozarks.org/crosslines"
            />
            <ResourceCard
              title="OATS Transit"
              description="Provides transportation for older adults and individuals with disabilities across southwest Missouri."
              url="https://oatstransit.org/greene"
            />
            <ResourceCard
              title="empower: abilities"
              description="Assists with home safety modifications, accessibility services, and independent living support."
              url="https://empowerabilities.org"
            />
          </div>
        </section>

        {/* Well-Being Section */}
        <section className="mb-12">
          <SectionHeader
            title="Well-Being"
            description="Find support for emotional health, caregiving challenges, and serious illness."
            icon={<Heart className="w-8 h-8 text-white" />}
            iconBgColor="dusty-rose"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <ResourceCard
              title="Hospice Foundation for Outreach"
              description="Provide compassionate support for individuals and families during serious illness (e.g., CoxHealth Palliative Care, Good Shepherd, Seasons)."
            />
            <ResourceCard
              title="Alzheimer's Association – Greater Missouri Chapter"
              description="Offers education, 24/7 helpline, and support for those affected by dementia."
              url="https://alz.org/greatermissouri"
            />
            <ResourceCard
              title="Burrell Behavioral Health"
              description="Administers counseling and crisis services for individuals and families."
              url="https://burrellcenter.com"
            />
          </div>
        </section>

        {/* Community Section */}
        <section className="mb-12">
          <SectionHeader
            title="Community"
            description="Join local programs and spaces that promote health, creativity, and connection."
            icon={<Users className="w-8 h-8 text-white" />}
            iconBgColor="primary"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <ResourceCard
              title="Senior Centers (SeniorAge)"
              description="Offer meals, exercise, and hobby groups near you."
              url="https://senioragemo.org/senior-centers/locations"
            />
            <ResourceCard
              title="MSU 62: Nondegree Adult Student Fee Waiver Program"
              description="Invites adults age 62 and older to take university courses tuition-free for personal enrichment."
              url="https://adultstudents.missouristate.edu/msu62.htm"
            />
            <ResourceCard
              title="Ozarks Regional YMCA"
              description="Delivers programs that promote health, wellness, and intergenerational connection."
              url="https://orymca.org"
            />
          </div>
        </section>

        {/* Learning Section */}
        <section className="mb-12">
          <SectionHeader
            title="Learning"
            description="Learn new skills and connect with local experts."
            icon={<GraduationCap className="w-8 h-8 text-white" />}
            iconBgColor="accent"
          />

          <Card>
            <CardHeader>
              <CardTitle>Community Training Programs</CardTitle>
              <CardDescription>
                Our community partners regularly host free or low-cost virtual trainings for caregivers and community members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Visit <Link href="/#whats-happening" className="text-primary hover:underline font-medium">What&apos;s Happening</Link> for upcoming dates or explore past recordings.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Crisis Resources Banner */}
        <section className="mb-12">
          <Card className="border-sage/30 bg-sage/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Heart className="w-6 h-6 text-sage flex-shrink-0 mt-1" />
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Need Immediate Support?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you&apos;re experiencing a crisis or need mental health support, resources are available 24/7.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">988 Suicide &amp; Crisis Lifeline</p>
                        <p className="text-muted-foreground">Call or text 988</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Crisis Text Line</p>
                        <p className="text-muted-foreground">Text HOME to 741741</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Missouri Crisis Line</p>
                        <p className="text-muted-foreground">1-888-279-8369</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Veterans Crisis Line</p>
                        <p className="text-muted-foreground">Call 1-800-273-8255 or text 838255</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicPageLayout>
  );
}

interface ResourceCardProps {
  title: string;
  description: string;
  url?: string;
}

function ResourceCard({ title, description, url }: ResourceCardProps): ReactElement {
  return (
    <Card className="bg-white border-sage/20 shadow-md hover:shadow-xl transition-all duration-300 hover:border-sage hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="text-lg font-bold">{title}</span>
          {url && <ExternalLinkIcon className="w-5 h-5 text-sage flex-shrink-0 mt-1" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage hover:text-sage-dark font-semibold inline-flex items-center gap-2 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-sage/50 rounded"
          >
            Visit Website
            <ExternalLinkIcon className="w-4 h-4 text-sage flex-shrink-0" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
