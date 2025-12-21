'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement, useState } from 'react'
import {
  Users,
  Hand,
  Handshake,
  Heart,
  Star,
  Sprout,
  HandHelping,
  GraduationCap,
  Home,
  BookOpen,
  Mail,
  MapPin,
  Stethoscope,
  ShoppingCart,
  Car,
  Wrench,
  Laptop,
  Coffee,
  User,
  type LucideIcon
} from 'lucide-react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import WhatsHappeningSection from '@/components/WhatsHappeningSection'

import LandingSection from '@/components/LandingSection'

// Help categories data for maintainability
const HELP_CATEGORIES = [
  { icon: Stethoscope, label: 'Health & Caregiving' },
  { icon: ShoppingCart, label: 'Groceries & Meals' },
  { icon: Car, label: 'Transportation & Errands' },
  { icon: Wrench, label: 'Household & Yard' },
  { icon: Laptop, label: 'Technology & Administrative' },
  { icon: Coffee, label: 'Social & Companionship' },
] as const

// Steps data for How It Works section
const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Create an Account',
    description: 'Sign up with your basic information to become part of our trusted community network.',
  },
  {
    number: 2,
    title: 'Request or Offer Help',
    description: 'Post what you need help with and browse requests from others who need help.',
  },
  {
    number: 3,
    title: 'Build Community',
    description: 'Become a valuable part of our community that is making caregiving sustainable.',
  },
] as const

// Step component for How It Works section
interface StepProps {
  number: number
  title: string
  description: string
}

function Step({ number, title, description }: StepProps): ReactElement {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <div>
        <strong className="text-foreground block mb-1">{title}</strong>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

export default function HomePage(): ReactElement {
  const { isAuthenticated, displayName, isLoading } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()
  const [imageError, setImageError] = useState(false)

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
                <li><Link href="#what-is-care" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">What is CARE?</Link></li>
                <li><Link href="#about" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">About Us</Link></li>
                <li><Link href="#whats-happening" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">What&apos;s Happening</Link></li>
                <li><Link href="#resources-preview" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">Resources</Link></li>
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
                    <button type="submit" className="px-3 xl:px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 min-h-[44px] flex items-center text-sm xl:text-base text-white bg-[#D8837C] hover:bg-[#C7726C] focus:ring-[#D8837C]/50">
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

        {/* What is CARE Collective? - Three Box Layout */}
        <LandingSection
          id="what-is-care"
          title="What is CARE Collective?"
          animation="slide-up"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Box 1: How It Works */}
            <div
              id="how-it-works"
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              role="region"
              aria-labelledby="how-it-works-heading"
            >
              <h3 id="how-it-works-heading" className="text-[22px] md:text-2xl lg:text-[26px] font-bold text-foreground mb-6 text-center">How It Works</h3>
              <div className="space-y-6">
                {HOW_IT_WORKS_STEPS.map((step) => (
                  <Step key={step.number} {...step} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 text-base font-semibold rounded-lg hover:bg-primary-contrast transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 min-h-[44px]">
                  Get Started Today
                </Link>
              </div>
            </div>

            {/* Box 2: Why Join? */}
            <div
              id="why-join"
              className="bg-sage-light/10 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-sage-light/30"
              role="region"
              aria-labelledby="why-join-heading"
            >
              <h3 id="why-join-heading" className="text-[22px] md:text-2xl lg:text-[26px] font-bold text-foreground mb-4 text-center">Why Join?</h3>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Are you caring for an aging loved one? By joining the CARE Collective, you can connect with other caregivers who understand caregiving and are ready to help and be helped.
              </p>
              <p className="text-muted-foreground text-sm font-semibold mb-4">As a member, you&apos;ll have access to:</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Handshake className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-foreground text-sm">Mutual exchange</strong>
                    <span className="text-muted-foreground text-sm block">Give what you can and receive what you need.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-foreground text-sm">Flexibility</strong>
                    <span className="text-muted-foreground text-sm block">Engage when and how you can.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-foreground text-sm">Learning opportunities</strong>
                    <span className="text-muted-foreground text-sm block">The Collective offers workshops on topics chosen by members.</span>
                  </div>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <Link href="/signup" className="inline-flex items-center justify-center bg-sage text-white px-6 py-3 text-base font-semibold rounded-lg hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[44px]">
                  Join Our Community
                </Link>
              </div>
            </div>

            {/* Box 3: Kinds of Help */}
            <div
              id="kinds-of-help"
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              role="region"
              aria-labelledby="kinds-of-help-heading"
            >
              <h3 id="kinds-of-help-heading" className="text-[22px] md:text-2xl lg:text-[26px] font-bold text-foreground mb-4 text-center">Kinds of Help</h3>
              <p className="text-muted-foreground text-center mb-6 text-sm">Members help each other with:</p>
              <ul className="space-y-3">
                {HELP_CATEGORIES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sage-light/10 transition-colors">
                    <Icon className="w-5 h-5 text-sage-dark flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium text-sm">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </LandingSection>

        {/* About Section - Inspired by Kinder Ground */}
        <section id="about" className="relative overflow-hidden">
          {/* Section Title on cream background */}
          <div className="bg-background py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center">
                About CARE Collective
              </h2>
            </div>
          </div>

          {/* Main Content Area with sage background */}
          <div className="bg-sage-dark relative">
            {/* Decorative curved top edge */}
            <div className="absolute top-0 left-0 right-0 h-16 md:h-24 bg-background" style={{ borderRadius: '0 0 50% 50%' }} />
            
            <div className="container mx-auto px-4 pt-20 md:pt-28 pb-16 md:pb-20">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  
                  {/* Left: Photo with caption */}
                  <div className="flex-shrink-0 text-center lg:text-left">
                    {/* Circular photo with border */}
                    <div className="relative inline-block">
                      <div className="w-52 h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full border-4 border-dusty-rose/70 p-1.5 bg-sage-dark">
                        <div className="w-full h-full rounded-full overflow-hidden bg-sage-light/30">
                          {imageError ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-20 h-20 text-white/40" aria-hidden="true" />
                            </div>
                          ) : (
                            <Image
                              src="/maureen-portrait.jpg"
                              alt="Dr. Maureen Templeman, CARE Collective Project Creator"
                              width={300}
                              height={300}
                              className="w-full h-full object-cover object-[center_20%]"
                              onError={() => setImageError(true)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Caption */}
                    <p className="mt-5 text-base italic text-white/90">
                      Dr. Maureen Templeman
                    </p>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Icon + Who We Are heading */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                      <div className="bg-white/10 p-2.5 rounded-full">
                        <Handshake className="w-7 h-7 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        Who We Are
                      </h3>
                    </div>
                    
                    {/* Main text - larger, more impactful */}
                    <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-light">
                      The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources. The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement.
                    </p>
                    
                    {/* Highlighted statement */}
                    <p className="mt-6 text-xl md:text-2xl lg:text-3xl font-semibold text-white">
                      Together, we are making caregiving sustainable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learn More CTA - on cream background */}
          <div className="bg-background py-10 md:py-14">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto">
                <Link
                  href="/about"
                  className="group flex items-center justify-between bg-sage hover:bg-sage-dark text-white py-5 px-8 rounded-xl transition-all duration-300 hover:shadow-xl"
                >
                  <div>
                    <span className="block text-lg md:text-xl font-semibold">
                      Learn More About Us
                    </span>
                    <span className="block text-sm mt-1 text-white/80">
                      Discover our mission, vision, and community standards
                    </span>
                  </div>
                  <svg 
                    className="w-6 h-6 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

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
                    <BookOpen className="w-10 h-10 text-accent" aria-label="Educational resources" />
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
              <p className="text-sm text-white/80">A project of Missouri State University, funded by the Southern Gerontological Society.</p>
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