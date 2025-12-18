'use client'

import React, { ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mail,
  MapPin
} from 'lucide-react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import WhatsHappeningSection from '@/components/WhatsHappeningSection'
import {
  WhatIsCareSection,
  AboutSection,
  ResourcesSection,
  ContactSection
} from '@/components/HomePageSections'

export default function HomePage(): ReactElement {
  const { isAuthenticated, displayName, isLoading } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brown text-white shadow-lg transition-colors duration-300">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="bg-cream/10 p-1.5 rounded-lg group-hover:bg-cream/20 transition-colors">
                <Image
                  src="/logo-textless.png"
                  alt="CARE Collective Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                  priority
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight">CARE Collective</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center">
              <ul className="flex items-center gap-6 list-none font-medium">
                <li><Link href="#what-is-care" onClick={handleSmoothScroll} className="hover:text-tan transition-colors py-2 text-lg">About</Link></li>
                <li><Link href="#whats-happening" onClick={handleSmoothScroll} className="hover:text-tan transition-colors py-2 text-lg">What&apos;s Happening</Link></li>
                <li><Link href="#resources" onClick={handleSmoothScroll} className="hover:text-tan transition-colors py-2 text-lg">Resources</Link></li>
                <li><Link href="#contact" onClick={handleSmoothScroll} className="hover:text-tan transition-colors py-2 text-lg">Contact</Link></li>
              </ul>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="bg-rose text-brown px-6 py-2.5 rounded-xl font-bold hover:bg-rose-light transition-all duration-300 hover:shadow-lg text-lg">Dashboard</Link>
                  <form action="/api/auth/logout" method="post" className="inline">
                    <button type="submit" className="text-white hover:text-tan font-semibold text-lg px-3 transition-colors">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/signup" className="bg-teal text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal/90 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-white/20 text-lg">
                  Join Community
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav variant="homepage" />
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 pt-0">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. What is CARE Collective? - Cream Background */}
        <WhatIsCareSection />

        {/* 3. About Section - Tan Background */}
        <AboutSection />

        {/* 4. What's Happening Section - Brown Background */}
        <section id="whats-happening" className="py-24 bg-brown text-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-white">What&apos;s Happening</h2>
            <WhatsHappeningSection variant="dark" />
          </div>
        </section>

        {/* 5. Community Resources Section - Cream Background */}
        <ResourcesSection />

        {/* 6. Get in Touch Section - Terracotta Background */}
        <ContactSection />
      </main>

      {/* 7. Footer - Navy Background */}
      <footer className="bg-navy text-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">

            {/* Column 1: Branding & Funding (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">CARE Collective</h3>
                <p className="text-white/70 text-lg">Community mutual support for Southwest Missouri</p>
              </div>

              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <p className="text-white/80 leading-relaxed italic">
                  "Funded by the Southern Gerontological Society and the Department of Sociology, Anthropology, and Gerontology at Missouri State University."
                </p>
              </div>

              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61582852599484"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-300"
                  aria-label="Visit us on Facebook"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Contact (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="text-lg font-bold text-tan mb-6 uppercase tracking-wider">Contact</h4>
              <div className="space-y-4 text-white/80 text-lg">
                <p className="font-semibold text-white">Dr. Maureen Templeman</p>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-tan mt-1 flex-shrink-0" />
                  <span>Springfield, MO</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-tan mt-1 flex-shrink-0" />
                  <a href="mailto:swmocarecollective@gmail.com" className="hover:text-tan transition-colors break-all">
                    swmocarecollective@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Links (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-bold text-tan mb-6 uppercase tracking-wider">Navigate</h4>
              <ul className="space-y-3 text-lg">
                <li><Link href="#what-is-care" onClick={handleSmoothScroll} className="text-white/80 hover:text-tan transition-colors">About</Link></li>
                <li><Link href="#whats-happening" onClick={handleSmoothScroll} className="text-white/80 hover:text-tan transition-colors">Events</Link></li>
                <li><Link href="/resources" className="text-white/80 hover:text-tan transition-colors">Resources</Link></li>
                <li><Link href="/signup" className="text-white/80 hover:text-tan transition-colors">Join Us</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-lg font-bold text-tan mb-6 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-lg">
                <li><Link href="/terms" className="text-white/80 hover:text-tan transition-colors">Terms</Link></li>
                <li><Link href="/privacy-policy" className="text-white/80 hover:text-tan transition-colors">Privacy</Link></li>
                <li><Link href="/help" className="text-white/80 hover:text-tan transition-colors">Help</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-8 text-center text-white/50">
            <p>&copy; 2025 CARE Collective - Southwest Missouri. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}