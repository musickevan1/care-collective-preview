import { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Heart, Home, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Community Resources - Care Collective',
  description: 'Trusted local and regional organizations offering practical support, guidance, and connection in Southwest Missouri.',
};

export default function ResourcesPage(): ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/10 to-dusty-rose-light/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back to Home */}
        <div className="mb-6">
          <Button asChild variant="default" size="sm">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-br from-primary to-primary-contrast rounded-full shadow-lg mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Community Resources</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The CARE Collective connects community members with trusted local and regional organizations
            that offer practical support, guidance, and connection.
          </p>
        </div>

        {/* Essentials Section */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-sage to-sage-dark rounded-xl shadow-md">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Essentials</h2>
              <p className="text-muted-foreground text-lg">Get help with food, housing, and everyday needs.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              title="Crosslines / Council of Churches of the Ozarks"
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
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-dusty-rose to-dusty-rose-dark rounded-xl shadow-md">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Well-Being</h2>
              <p className="text-muted-foreground text-lg">Find support for emotional health, caregiving challenges, and serious illness.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ResourceCard
              title="Local Hospice & Palliative Care Programs"
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
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-contrast rounded-xl shadow-md">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Community</h2>
              <p className="text-muted-foreground text-lg">Join local programs and spaces that promote health, creativity, and connection.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-accent to-accent-dark rounded-xl shadow-md">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Learning</h2>
              <p className="text-muted-foreground text-lg">Learn new skills and connect with local experts.</p>
            </div>
          </div>

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
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Need Immediate Support?</h3>
                  <p className="text-muted-foreground mb-3">
                    If you&apos;re experiencing a crisis or need mental health support, we have resources available 24/7.
                  </p>
                  <Link
                    href="/crisis-resources"
                    className="inline-flex items-center gap-2 text-sage hover:underline font-medium"
                  >
                    View Crisis Resources
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
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
          {url && <ExternalLink className="w-5 h-5 text-sage flex-shrink-0 mt-1" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage hover:text-sage-dark font-semibold inline-flex items-center gap-2 hover:underline transition-colors"
          >
            Visit Website
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
