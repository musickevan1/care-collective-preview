'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import {
  Users,
  Handshake,
  Heart,
  Star,
  GraduationCap,
  Home,
  Mail,
  MapPin
} from 'lucide-react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import WhatsHappeningSection from '@/components/WhatsHappeningSection'

import LandingSection from '@/components/LandingSection'

export default function HomePage(): ReactElement {
  const { isAuthenticated, displayName, isLoading } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={48}
                height={48}
                className="rounded w-10 h-10 sm:w-12 sm:h-12"
                priority
                sizes="(max-width: 640px) 40px, 48px"
              />
              <span className="text-lg sm:text-xl font-bold truncate">CARE Collective</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
              <ul className="flex items-center gap-3 xl:gap-4 list-none">
                <li><Link href="#how-it-works" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">How It Works</Link></li>
                <li><Link href="#why-join" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">Why Join?</Link></li>
                <li><Link href="#about" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">About Us</Link></li>
                <li><Link href="#whats-happening" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">What&apos;s Happening</Link></li>
                <li><Link href="#resources-preview" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">Resources</Link></li>
                <li><Link href="#contact-preview" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">Contact Us</Link></li>
              </ul>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
              {isLoading ? (
                <div className="bg-sage/50 text-white px-3 xl:px-4 py-2 rounded-lg font-semibold min-h-[44px] flex items-center animate-pulse text-sm xl:text-base">Loading...</div>
              ) : isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="bg-secondary text-secondary-foreground px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-secondary/90 transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 min-h-[44px] flex items-center text-sm xl:text-base">Dashboard</Link>
                  <form action="/api/auth/logout" method="post" className="inline">
                    <button type="submit" className="px-3 xl:px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 min-h-[44px] flex items-center text-sm xl:text-base text-white focus:ring-[#D8837C]/50" style={{ backgroundColor: '#D8837C' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C7726C'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D8837C'}>
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/signup" className="bg-sage text-white px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap">Join Community</Link>
                  <Link href="/login" className="border-2 border-white text-white px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-navy min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap">Member Login</Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav variant="homepage" />
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Enhanced Hero Section */}
        <Hero />

        {/* How It Works Section */}
        <LandingSection
          id="how-it-works"
          title="How It Works"
          animation="slide-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            <div className="text-center card-standard hover-lift relative group">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-background">
                1
              </div>
              <div className="flex justify-center mb-6 mt-4">
                <Users className="w-12 h-12 text-sage-dark group-hover:scale-110 transition-transform duration-300" aria-label="Community members" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Create an Account</h3>
              <p className="text-muted-foreground">
                Sign up with your basic information to become part of our trusted community network.
              </p>
            </div>

            <div className="text-center card-standard hover-lift relative group">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-background">
                2
              </div>
              <div className="flex justify-center mb-6 mt-4">
                <Handshake className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-300" aria-label="Request or offer help" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Request or Offer Help</h3>
              <p className="text-muted-foreground">
                Post what you need help with and browse requests from others who need help.
              </p>
            </div>

            <div className="text-center card-standard hover-lift relative group">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-background">
                3
              </div>
              <div className="flex justify-center mb-6 mt-4">
                <Handshake className="w-12 h-12 text-sage-dark group-hover:scale-110 transition-transform duration-300" aria-label="Connect with neighbors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Build Community</h3>
              <p className="text-muted-foreground">
                Become a valuable part of our community that is making caregiving sustainable.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg hover:bg-primary-contrast transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/20 min-h-[48px] group">
              <span>Get Started Today</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </LandingSection>

        {/* Why Join Section */}
        <LandingSection
          id="why-join"
          title="Why Join?"
          subtitle="Are you caring for an aging loved one? By joining the CARE Collective, you can connect with other caregivers who understand caregiving and are ready to help and be helped."
          variant="alternate"
          animation="fade-in"
        >
          <div className="max-w-4xl mx-auto bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/40">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-8 text-center">
              As a member, you&apos;ll have access to:
            </h3>

            <ul className="space-y-6 mb-8">
              <li className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Handshake className="w-6 h-6 text-sage-dark flex-shrink-0" aria-hidden="true" />
                </div>
                <div>
                  <strong className="text-foreground text-lg block mb-1">Mutual exchange</strong>
                  <span className="text-muted-foreground leading-relaxed">Give what you can and receive what you need.</span>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Handshake className="w-6 h-6 text-sage-dark flex-shrink-0" aria-hidden="true" />
                </div>
                <div>
                  <strong className="text-foreground text-lg block mb-1">Flexibility that works for you</strong>
                  <span className="text-muted-foreground leading-relaxed">Engage when and how you can.</span>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <GraduationCap className="w-6 h-6 text-sage-dark flex-shrink-0" aria-hidden="true" />
                </div>
                <div>
                  <strong className="text-foreground text-lg block mb-1">Learning opportunities</strong>
                  <span className="text-muted-foreground leading-relaxed">The Collective offers workshops on topics chosen by members.</span>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Heart className="w-6 h-6 text-dusty-rose fill-dusty-rose flex-shrink-0" aria-hidden="true" />
                </div>
                <div>
                  <strong className="text-foreground text-lg block mb-1">No pressure</strong>
                  <span className="text-muted-foreground leading-relaxed">You belong here, and it&apos;s okay to be in a season where you mostly need support.</span>
                </div>
              </li>
            </ul>

            <div className="text-center pt-4">
              <Link href="/signup" className="inline-flex items-center justify-center bg-sage text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-sage-dark transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[48px] group">
                <span>Join Our Community</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </LandingSection>

        {/* Kinds of Help Section */}
        <LandingSection
          id="kinds-of-help"
          title="Kinds of Help"
          subtitle="Members help each other with a variety of practical tasks."
          animation="slide-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Health & Caregiving</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Groceries & Meals</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Transportation & Errands</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Household & Yard</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Technology & Administrative</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-foreground text-center">Social & Companionship</h3>
            </div>
          </div>
        </LandingSection>

        {/* About Section */}
        <LandingSection
          id="about"
          title="About CARE Collective"
          animation="slide-up"
        >
          <div className="space-y-8 max-w-6xl mx-auto">
            {/* Who We Are - Full Width */}
            <div className="bg-almond p-8 md:p-10 rounded-xl shadow-lg border border-almond/50">
              <div className="flex justify-center mb-6">
                <div className="bg-white p-3 rounded-full shadow-md">
                  <div className="w-32 h-32 relative overflow-hidden rounded-full border-4 border-sage-light">
                    <Image
                      src="/maureen-portrait.png"
                      alt="Dr. Maureen Templeman"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 font-heading text-center">Who We Are</h3>
              <p className="text-lg leading-relaxed text-foreground max-w-4xl mx-auto text-center">
                The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources. The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement. Together, we are building a space where caregivers find connection, practical help, and the mutual support that makes caregiving sustainable.
              </p>
            </div>
          </div>

          {/* Learn More - Prominent Box Button */}
          <div className="mt-12 max-w-md mx-auto">
            <Link
              href="/about"
              className="block bg-sage text-white p-6 rounded-lg text-center hover:bg-sage-dark transition-all duration-300 hover:shadow-xl group"
            >
              <span className="text-xl font-semibold group-hover:scale-105 inline-block transition-transform">Learn More About Us</span>
              <span className="block text-sm mt-2 text-white/80">
                Discover our mission, vision, and community standards
              </span>
            </Link>
          </div>
        </LandingSection>

        {/* What's Happening Section */}
        <LandingSection
          id="whats-happening"
          title="What's Happening"
          variant="alternate"
          animation="fade-in"
        >
          <div className="text-center">
            <WhatsHappeningSection />

            <div className="mt-12">
              <Link href="/dashboard" className="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-lg hover:bg-secondary/90 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-secondary/20 min-h-[48px] group">
                <span>View All in Member Portal</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </LandingSection>

        {/* Resources Preview Section */}
        <LandingSection
          id="resources-preview"
          title="Community Resources"
          subtitle="Connect with trusted local and regional organizations that offer practical support, guidance, and connection."
          animation="slide-up"
        >
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Essentials */}
              <div className="text-center card-standard hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="bg-sage/10 p-3 rounded-full group-hover:bg-sage/20 transition-colors">
                    <Home className="w-10 h-10 text-sage-dark" aria-label="Essential needs" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Essentials</h3>
                <p className="text-muted-foreground">Food, housing, and everyday needs</p>
              </div>

              {/* Well-Being */}
              <div className="text-center card-standard hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="bg-dusty-rose/10 p-3 rounded-full group-hover:bg-dusty-rose/20 transition-colors">
                    <Heart className="w-10 h-10 text-dusty-rose fill-dusty-rose" aria-label="Well-being support" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Well-Being</h3>
                <p className="text-muted-foreground">Emotional health and caregiving support</p>
              </div>

              {/* Community */}
              <div className="text-center card-standard hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Users className="w-10 h-10 text-primary" aria-label="Community programs" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Community</h3>
                <p className="text-muted-foreground">Local programs and connections</p>
              </div>

              {/* Learning */}
              <div className="text-center card-standard hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="bg-accent/10 p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                    <GraduationCap className="w-10 h-10 text-accent" aria-label="Educational resources" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Learning</h3>
                <p className="text-muted-foreground">Training and educational programs</p>
              </div>
            </div>

            <div className="mt-12">
              <Link href="/resources" className="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-lg hover:bg-secondary/90 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-secondary/20 min-h-[48px] group">
                <span>View All Resources</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </LandingSection>

        {/* Contact Preview Section */}
        <LandingSection
          id="contact-preview"
          title="Get in Touch"
          subtitle="Have questions or feedback? We're here to help."
          variant="alternate"
          animation="fade-in"
        >
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              {/* Email */}
              <div className="bg-white p-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-6">
                    <div className="bg-sage/10 p-4 rounded-full">
                      <Mail className="w-12 h-12 text-sage-dark" aria-label="Email contact" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Email Us</h3>
                </div>
                <div className="text-center">
                  <a href="mailto:swmocarecollective@gmail.com" className="text-xl text-sage hover:text-sage-dark hover:underline font-bold break-all transition-colors">
                    swmocarecollective@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Link href="/contact" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg hover:bg-primary-contrast transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/20 min-h-[48px] group">
                <span>Visit Full Contact Page</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </LandingSection>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-navy text-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Column 1: Branding */}
            <div>
              <h3 className="text-lg font-bold text-sage-light mb-3">CARE Collective</h3>
              <p className="text-sm text-white/80">Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University.</p>
            </div>

            {/* Column 2: Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Contact</h4>
              <div className="space-y-1 text-sm">
                <p className="text-white/80">Dr. Maureen Templeman</p>
                <p className="text-white/80">Springfield, MO</p>
                <a href="mailto:swmocarecollective@gmail.com" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">
                  swmocarecollective@gmail.com
                </a>
              </div>
            </div>

            {/* Column 3: Quick Actions */}
            <div>
              <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Get Started</h4>
              <ul className="space-y-1 list-none text-sm">
                <li><Link href="/signup" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Join Community</Link></li>
                <li><Link href="/login" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Member Login</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal & Resources */}
            <div>
              <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Resources</h4>
              <ul className="space-y-1 list-none text-sm">
                <li><Link href="/help" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Help & Support</Link></li>
                <li><Link href="/terms" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Terms of Service</Link></li>
                <li><Link href="/privacy-policy" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-4 mt-2 text-center">
            <p className="text-sm text-white/60">&copy; 2025 CARE Collective - Southwest Missouri. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}