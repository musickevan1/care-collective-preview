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
import { SectionDivider } from '@/components/ui/SectionDivider'
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
    <div className="flex items-start gap-5">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl md:text-2xl flex-shrink-0 shadow-md">
        {number}
      </div>
      <div>
        <strong className="text-foreground block mb-2 text-xl md:text-2xl">{title}</strong>
        <p className="text-foreground/70 text-base md:text-lg leading-relaxed">{description}</p>
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
        <section id="what-is-care" className="relative overflow-hidden">
          {/* Section Title on cream background */}
          <div className="bg-background py-16 md:py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl sm:text-5xl md:text-[48px] font-bold text-brown text-center uppercase tracking-wide">
                What is CARE Collective?
              </h2>
            </div>
          </div>

          {/* Cards on dusty rose/20% background */}
          <div className="bg-dusty-rose/20 relative py-16 md:py-24">
            {/* Wave divider at top */}
            <SectionDivider
              variant="curve"
              position="top"
              fillColor="var(--color-background)"
              height="md"
            />
            
            <div className="container mx-auto px-4 pt-8 md:pt-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Box 1: How It Works */}
                <div
                  id="how-it-works"
                  className="bg-white rounded-3xl shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  role="region"
                  aria-labelledby="how-it-works-heading"
                >
                  <h3 id="how-it-works-heading" className="text-2xl md:text-[28px] font-bold text-brown mb-8 text-center">How It Works</h3>
                  <div className="space-y-8">
                    {HOW_IT_WORKS_STEPS.map((step) => (
                      <Step key={step.number} {...step} />
                    ))}
                  </div>
                  <div className="mt-10 text-center">
                    <Link href="/signup" className="inline-flex items-center justify-center bg-sage text-white px-8 py-4 text-lg font-bold rounded-xl hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[56px]">
                      Get Started Today
                    </Link>
                  </div>
                </div>

                {/* Box 2: Why Join? */}
                <div
                  id="why-join"
                  className="bg-white rounded-3xl shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ring-2 ring-sage/20"
                  role="region"
                  aria-labelledby="why-join-heading"
                >
                  <h3 id="why-join-heading" className="text-2xl md:text-[28px] font-bold text-brown mb-6 text-center">Why Join?</h3>
                  <p className="text-foreground/70 text-center mb-8 text-lg leading-relaxed">
                    Are you caring for an aging loved one? Connect with other caregivers who understand and are ready to help.
                  </p>
                  <p className="text-brown text-lg font-bold mb-6">As a member, you&apos;ll have access to:</p>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-4">
                      <div className="bg-sage/10 p-2 rounded-lg flex-shrink-0">
                        <Handshake className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                      </div>
                      <div>
                        <strong className="text-brown text-lg">Mutual exchange</strong>
                        <span className="text-foreground/70 text-base block mt-1">Give what you can and receive what you need.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-sage/10 p-2 rounded-lg flex-shrink-0">
                        <Star className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                      </div>
                      <div>
                        <strong className="text-brown text-lg">Flexibility</strong>
                        <span className="text-foreground/70 text-base block mt-1">Engage when and how you can.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-sage/10 p-2 rounded-lg flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                      </div>
                      <div>
                        <strong className="text-brown text-lg">Learning opportunities</strong>
                        <span className="text-foreground/70 text-base block mt-1">Workshops on topics chosen by members.</span>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-10 text-center">
                    <Link href="/signup" className="inline-flex items-center justify-center bg-sage text-white px-8 py-4 text-lg font-bold rounded-xl hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[56px]">
                      Join Our Community
                    </Link>
                  </div>
                </div>

                {/* Box 3: Kinds of Help */}
                <div
                  id="kinds-of-help"
                  className="bg-white rounded-3xl shadow-lg p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  role="region"
                  aria-labelledby="kinds-of-help-heading"
                >
                  <h3 id="kinds-of-help-heading" className="text-2xl md:text-[28px] font-bold text-brown mb-6 text-center">Kinds of Help</h3>
                  <p className="text-foreground/70 text-center mb-8 text-lg">Members help each other with:</p>
                  <ul className="space-y-3">
                    {HELP_CATEGORIES.map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-sage/5 transition-colors">
                        <div className="bg-sage/10 p-2.5 rounded-lg">
                          <Icon className="w-6 h-6 text-sage-dark flex-shrink-0" aria-hidden="true" />
                        </div>
                        <span className="text-brown font-semibold text-lg">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Wave divider at bottom */}
            <SectionDivider
              variant="curve"
              position="bottom"
              fillColor="var(--color-background)"
              height="md"
            />
          </div>
        </section>

        {/* About Section - Inspired by Wireframe */}
        <section id="about" className="relative overflow-hidden">
          {/* Section Title on cream background */}
          <div className="bg-background py-16 md:py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl sm:text-5xl md:text-[48px] font-bold text-brown text-center uppercase tracking-wide">
                About CARE Collective
              </h2>
            </div>
          </div>

          {/* Main Content Area with sage-dark background */}
          <div className="bg-sage-dark relative">
            {/* Organic wave divider at top */}
            <SectionDivider
              variant="organic"
              position="top"
              fillColor="var(--color-background)"
              height="lg"
            />
            
            <div className="container mx-auto px-4 pt-24 md:pt-32 pb-20 md:pb-28">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                  
                  {/* Left: Photo with dusty rose ring */}
                  <div className="flex-shrink-0 text-center">
                    {/* Circular photo with decorative border ring */}
                    <div className="relative inline-block">
                      {/* Outer dusty rose ring */}
                      <div className="w-56 h-56 md:w-64 md:h-64 lg:w-[280px] lg:h-[280px] rounded-full p-2 bg-gradient-to-br from-dusty-rose/60 to-dusty-rose/40">
                        <div className="w-full h-full rounded-full overflow-hidden bg-sage-dark">
                          {imageError ? (
                            <div className="w-full h-full flex items-center justify-center bg-sage/50">
                              <User className="w-24 h-24 text-white/50" aria-hidden="true" />
                            </div>
                          ) : (
                            <Image
                              src="/maureen-portrait.jpg"
                              alt="Dr. Maureen Templeman, CARE Collective Project Creator"
                              width={280}
                              height={280}
                              className="w-full h-full object-cover object-[center_10%]"
                              onError={() => setImageError(true)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Caption */}
                    <p className="mt-6 text-lg italic text-white/90 text-center font-medium">
                      Dr. Maureen Templeman
                    </p>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 text-center lg:text-left">
                    {/* Icon + Who We Are heading */}
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                      <div className="bg-white/10 p-3.5 rounded-full">
                        <Handshake className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">
                        Who We Are
                      </h3>
                    </div>
                    
                    {/* Main text - Large and impactful */}
                    <p className="text-xl md:text-2xl lg:text-[24px] text-white leading-relaxed">
                      The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
                    </p>
                    
                    {/* Highlighted statement + CTA button */}
                    <div className="mt-10 flex flex-col items-center lg:items-start gap-8">
                      <p className="text-2xl md:text-3xl lg:text-[32px] font-bold text-white leading-snug">
                        Together, we are making caregiving sustainable.
                      </p>
                      <Link
                        href="/about"
                        className="group inline-flex items-center gap-3 bg-background hover:bg-white text-brown py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl"
                      >
                        Learn More About Us
                        <svg 
                          className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
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
              </div>
            </div>
          </div>
        </section>

        {/* What's Happening Section */}
        <section id="whats-happening" className="relative overflow-hidden">
          {/* Section Title on cream background */}
          <div className="bg-background py-16 md:py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl sm:text-5xl md:text-[48px] font-bold text-brown text-center uppercase tracking-wide">
                What&apos;s Happening
              </h2>
            </div>
          </div>

          {/* Content on sage/15% background */}
          <div className="bg-sage/15 relative py-16 md:py-24">
            {/* Wave divider at top */}
            <SectionDivider
              variant="wave"
              position="top"
              fillColor="var(--color-background)"
              height="md"
            />
            
            <div className="container mx-auto px-4 pt-8 md:pt-12">
              <div className="text-center">
                <WhatsHappeningSection />

                <div className="mt-14">
                  <Link href="/dashboard" className="group inline-flex items-center justify-center bg-sage text-white px-10 py-5 text-lg md:text-xl font-bold rounded-xl hover:bg-sage-dark transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[60px]">
                    <span>View All in Member Portal</span>
                    <svg className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Wave divider at bottom */}
            <SectionDivider
              variant="wave"
              position="bottom"
              fillColor="var(--color-background)"
              height="md"
            />
          </div>
        </section>

        {/* Resources Preview Section */}
        <section id="resources-preview" className="bg-background py-20 md:py-28">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-[48px] font-bold text-brown mb-6 uppercase tracking-wide">
                Community Resources
              </h2>
              <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed">
                Connect with trusted local and regional organizations that offer practical support, guidance, and connection.
              </p>
            </div>

            {/* Resource Cards - 2x2 Grid on medium, 4 across on large */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              {/* Essentials */}
              <div className="text-center bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex justify-center mb-6">
                  <div className="bg-sage/10 p-5 rounded-2xl group-hover:bg-sage/20 transition-colors duration-300">
                    <Home className="w-10 h-10 md:w-12 md:h-12 text-sage-dark" aria-label="Essential needs" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-brown mb-3">Essentials</h3>
                <p className="text-base md:text-lg text-foreground/70">Food, housing, and everyday needs</p>
              </div>

              {/* Well-Being */}
              <div className="text-center bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex justify-center mb-6">
                  <div className="bg-dusty-rose/10 p-5 rounded-2xl group-hover:bg-dusty-rose/20 transition-colors duration-300">
                    <Heart className="w-10 h-10 md:w-12 md:h-12 text-dusty-rose-dark" aria-label="Well-being support" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-brown mb-3">Well-Being</h3>
                <p className="text-base md:text-lg text-foreground/70">Emotional health and caregiving support</p>
              </div>

              {/* Community */}
              <div className="text-center bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex justify-center mb-6">
                  <div className="bg-sage/10 p-5 rounded-2xl group-hover:bg-sage/20 transition-colors duration-300">
                    <Users className="w-10 h-10 md:w-12 md:h-12 text-sage-dark" aria-label="Community programs" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-brown mb-3">Community</h3>
                <p className="text-base md:text-lg text-foreground/70">Local programs and connections</p>
              </div>

              {/* Learning */}
              <div className="text-center bg-white rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex justify-center mb-6">
                  <div className="bg-dusty-rose/10 p-5 rounded-2xl group-hover:bg-dusty-rose/20 transition-colors duration-300">
                    <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-dusty-rose-dark" aria-label="Educational resources" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-brown mb-3">Learning</h3>
                <p className="text-base md:text-lg text-foreground/70">Training and educational programs</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-14 text-center">
              <Link href="/resources" className="group inline-flex items-center justify-center bg-sage text-white px-10 py-5 text-lg md:text-xl font-bold rounded-xl hover:bg-sage-dark transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[60px]">
                <span>View All Resources</span>
                <svg className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Preview Section */}
        <section id="contact-preview" className="relative overflow-hidden">
          {/* Section on navy background */}
          <div className="bg-navy relative py-20 md:py-28">
            {/* Wave divider at top */}
            <SectionDivider
              variant="wave"
              position="top"
              fillColor="var(--color-background)"
              height="md"
            />
            
            <div className="container mx-auto px-4 pt-12 md:pt-16">
              <div className="text-center">
                {/* Section Header */}
                <h2 className="text-4xl sm:text-5xl md:text-[48px] font-bold text-white mb-4 uppercase tracking-wide">
                  Get in Touch
                </h2>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
                  Have questions or feedback? We&apos;re here to help.
                </p>

                {/* Email Card - Centered, max-width */}
                <div className="max-w-md mx-auto">
                  <div className="bg-white p-10 md:p-12 rounded-3xl shadow-2xl">
                    <div className="flex justify-center mb-6">
                      <div className="bg-sage/10 p-5 rounded-2xl">
                        <Mail className="w-12 h-12 md:w-14 md:h-14 text-sage-dark" aria-label="Email contact" />
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-[28px] font-bold text-brown mb-4">Email Us</h3>
                    <a 
                      href="mailto:swmocarecollective@gmail.com" 
                      className="text-lg md:text-xl text-sage hover:text-sage-dark hover:underline font-bold break-all transition-colors"
                    >
                      swmocarecollective@gmail.com
                    </a>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-12">
                  <Link href="/contact" className="group inline-flex items-center justify-center bg-background text-brown px-10 py-5 text-lg md:text-xl font-bold rounded-xl hover:bg-white transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/20 min-h-[60px]">
                    <span>Visit Full Contact Page</span>
                    <svg className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
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