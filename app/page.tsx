'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
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
  MapPin
} from 'lucide-react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { Button } from '@/components/ui/button'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import WhatsHappeningSection from '@/components/WhatsHappeningSection'

export default function HomePage(): ReactElement {
  const { isAuthenticated, displayName, isLoading } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()

  return (
    <div className="min-h-screen bg-background">
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
                <li><Link href="#home" onClick={handleSmoothScroll} className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">Home</Link></li>
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
                    <button type="submit" className="px-3 xl:px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 min-h-[44px] flex items-center text-sm xl:text-base text-white focus:ring-[#BB6446]/50" style={{ backgroundColor: '#BB6446' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A55639'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#BB6446'}>
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

      <main id="main-content" tabIndex={-1}>
        {/* Enhanced Hero Section */}
        <Hero />

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-white">
                    1
                  </div>
                  <div className="flex justify-center mb-6 mt-4">
                    <Users className="w-12 h-12 text-sage-dark" aria-label="Community members" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Join the Community</h3>
                  <p className="text-muted-foreground">
                    Sign up with your basic information to become part of our trusted community network.
                  </p>
                </div>

                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-white">
                    2
                  </div>
                  <div className="flex justify-center mb-6 mt-4">
                    <Hand className="w-12 h-12 text-primary" aria-label="Request or offer help" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Request or Offer Help</h3>
                  <p className="text-muted-foreground">
                    Post what you need help with, or browse requests to see how you can assist others.
                  </p>
                </div>

                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-sage-dark text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-white">
                    3
                  </div>
                  <div className="flex justify-center mb-6 mt-4">
                    <Handshake className="w-12 h-12 text-sage-dark" aria-label="Connect with neighbors" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Connect with Neighbors</h3>
                  <p className="text-muted-foreground">
                    Build meaningful relationships while giving and receiving support in your community.
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold rounded-lg hover:bg-primary-contrast transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/20 min-h-[48px] group">
                  <span>Get Started Today</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* Why Join CARE Collective Section */}
        <section id="why-join" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Why Join CARE Collective?
              </h2>
              <p className="text-xl font-medium text-muted-foreground mb-12 max-w-3xl mx-auto">
                Discover the benefits of being part of our caregiver community
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Community Building */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Users className="w-12 h-12 text-sage-dark" aria-label="Community building" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Community Building</h3>
                  <p className="text-muted-foreground">
                    Connect with neighbors who understand the unique challenges of caregiving
                  </p>
                </div>

                {/* Practical Help */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <HandHelping className="w-12 h-12 text-primary" aria-label="Practical help" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Practical Help</h3>
                  <p className="text-muted-foreground">
                    Exchange real support for everyday needs like groceries, transportation, and household tasks
                  </p>
                </div>

                {/* Resource Sharing */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <BookOpen className="w-12 h-12 text-accent" aria-label="Resource sharing" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Resource Sharing</h3>
                  <p className="text-muted-foreground">
                    Access community knowledge, local resources, and trusted information
                  </p>
                </div>

                {/* Emotional Support */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Heart className="w-12 h-12 text-dusty-rose fill-dusty-rose" aria-label="Emotional support" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Emotional Support</h3>
                  <p className="text-muted-foreground">
                    Find understanding, encouragement, and connection from those who truly get it
                  </p>
                </div>

                {/* Local Connections */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <MapPin className="w-12 h-12 text-sage" aria-label="Local connections" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Local Connections</h3>
                  <p className="text-muted-foreground">
                    Build relationships with people in your Missouri community who are close by
                  </p>
                </div>

                {/* Sustainable Caregiving */}
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Sprout className="w-12 h-12 text-sage-dark" aria-label="Sustainable caregiving" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Sustainable Caregiving</h3>
                  <p className="text-muted-foreground">
                    Create lasting networks of mutual support that help prevent caregiver burnout
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <Link href="/signup" className="inline-flex items-center justify-center bg-sage text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-sage-dark transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sage/20 min-h-[48px] group">
                  <span>Join Our Community</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* About Section */}
        <section id="about" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                About CARE Collective
              </h2>
              <p className="text-xl font-medium text-muted-foreground mb-12 max-w-3xl mx-auto">
                Building stronger communities through caregiver support and mutual assistance
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Main Content */}
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <HandHelping className="w-12 h-12 text-sage-dark" aria-label="Offering support" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">Our Story</h3>
                  </div>
                  <div className="text-left space-y-4">
                    <p className="text-lg leading-relaxed text-foreground">
                      The CARE Collective (Caregiver Assistance and Resource Exchange) is a community for
                      caregivers in Southwest Missouri. The Collective is powered by caregivers themselves -
                      neighbors supporting neighbors - along with students and volunteers who help maintain
                      the site and coordinate resources.
                    </p>
                    <p className="text-lg leading-relaxed text-foreground font-medium text-sage-dark">
                      Together, we are building a space where caregivers can find connection, strength,
                      and the support they deserve.
                    </p>
                  </div>
                </div>

                {/* Academic Partnership */}
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-dusty-rose">
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <GraduationCap className="w-12 h-12 text-dusty-rose-accessible" aria-label="Academic partnership" />
                    </div>
                    <h3 className="text-2xl font-bold text-dusty-rose-accessible mb-4">Academic Partnership</h3>
                  </div>
                  <div className="bg-dusty-rose-light/30 p-6 rounded-lg">
                    <p className="text-foreground leading-relaxed">
                      This project was created by <span className="font-semibold">Dr. Maureen Templeman</span>,
                      Department of Sociology, Anthropology, and Gerontology at Missouri State University,
                      with support from community partners and funding from the
                      <span className="font-semibold"> Southern Gerontological Society Innovative Projects Grant</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-12 space-y-4">
                <Link href="/signup" className="bg-sage text-white hover:bg-sage-dark px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:shadow-lg min-h-[48px] inline-flex items-center justify-center">
                  Join Our Community
                </Link>
                <div>
                  <Link href="/about" className="inline-flex items-center justify-center text-primary hover:text-primary/80 font-medium text-lg group">
                    <span>Learn More About Us</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* What's Happening Section */}
        <section id="whats-happening" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                What&apos;s Happening
              </h2>
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
          </div>
        </section>

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* Resources Preview Section */}
        <section id="resources-preview" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Community Resources
              </h2>
              <p className="text-xl font-medium text-muted-foreground mb-12 max-w-3xl mx-auto">
                Trusted local and regional organizations offering practical support
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {/* Essentials */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Home className="w-12 h-12 text-sage-dark" aria-label="Essential needs" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Essentials</h3>
                  <p className="text-muted-foreground">Food, housing, and everyday needs</p>
                </div>

                {/* Well-Being */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Heart className="w-12 h-12 text-dusty-rose fill-dusty-rose" aria-label="Well-being support" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Well-Being</h3>
                  <p className="text-muted-foreground">Emotional health and caregiving support</p>
                </div>

                {/* Community */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <Users className="w-12 h-12 text-primary" aria-label="Community programs" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Community</h3>
                  <p className="text-muted-foreground">Local programs and connections</p>
                </div>

                {/* Learning */}
                <div className="text-center bg-white p-6 rounded-lg shadow-lg hover:transform hover:-translate-y-2 hover:shadow-xl transition-all">
                  <div className="flex justify-center mb-4">
                    <BookOpen className="w-12 h-12 text-accent" aria-label="Educational resources" />
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
          </div>
        </section>

        {/* Terra Cotta Divider */}
        <div className="h-1 bg-primary w-full" />

        {/* Contact Preview Section */}
        <section id="contact-preview" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Get in Touch
              </h2>
              <p className="text-xl font-medium text-muted-foreground mb-12 max-w-3xl mx-auto">
                Have questions or feedback? We&apos;re here to help.
              </p>

              <div className="max-w-2xl mx-auto">
                {/* Email */}
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      <Mail className="w-12 h-12 text-sage-dark" aria-label="Email contact" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">Email Us</h3>
                  </div>
                  <div className="text-center">
                    <a href="mailto:swmocarecollective@gmail.com" className="text-lg text-sage hover:underline font-medium break-all">
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
              <p className="text-sm text-white/80">Community mutual aid for Southwest Missouri</p>
            </div>

            {/* Column 2: Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-sage-light mb-3 uppercase tracking-wide">Contact</h4>
              <div className="space-y-1 text-sm">
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
                <li><Link href="/dashboard" className="text-white/80 hover:text-sage-light transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded">Dashboard</Link></li>
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