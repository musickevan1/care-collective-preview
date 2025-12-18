'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import {
  Info,
  Heart,
  Users,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Mail,
  ArrowRight,
  Facebook
} from 'lucide-react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { useAuthNavigation } from '@/hooks/useAuthNavigation'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import WhatsHappeningSection from '@/components/WhatsHappeningSection'
import FeatureCard from '@/components/FeatureCard'
import LandingSection from '@/components/LandingSection'

export default function HomePage(): ReactElement {
  const { isAuthenticated, isLoading } = useAuthNavigation()
  const handleSmoothScroll = useSmoothScroll()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Navigation - Keeping cream background as per mockup */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-brown/10 shadow-sm">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-terracotta rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                C
              </div>
              <span className="text-brown text-lg sm:text-xl font-extrabold tracking-tight">CARE Collective</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              <ul className="flex items-center gap-4 xl:gap-6 list-none text-brown font-semibold text-sm tracking-wide">
                <li><Link href="/" className="hover:text-terracotta transition-colors">Home</Link></li>
                <li><Link href="#what-is-care" onClick={handleSmoothScroll} className="hover:text-terracotta transition-colors">How It Works</Link></li>
                <li><Link href="#about" onClick={handleSmoothScroll} className="hover:text-terracotta transition-colors">About</Link></li>
                <li><Link href="#resources" onClick={handleSmoothScroll} className="hover:text-terracotta transition-colors">Resources</Link></li>
              </ul>
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {isLoading ? (
                <div className="bg-sage/50 text-white px-6 py-2.5 rounded-lg font-bold min-h-[44px] flex items-center animate-pulse">Loading...</div>
              ) : isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="bg-sage text-white px-6 py-2.5 rounded-lg font-bold hover:bg-sage-dark transition-colors shadow-sm min-h-[44px] flex items-center">Dashboard</Link>
                  <form action="/api/auth/logout" method="post" className="inline">
                    <button type="submit" className="px-4 py-2.5 rounded-lg font-bold transition-colors min-h-[44px] flex items-center text-brown hover:text-terracotta">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/signup" className="bg-sage text-white px-6 py-2.5 rounded-lg font-bold hover:bg-sage-dark transition-colors shadow-sm min-h-[44px] flex items-center">
                  Join Now
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav variant="homepage" />
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* What is CARE Collective? Section - 3 Equal Cards */}
        <LandingSection
          id="what-is-care"
          title="What is CARE Collective?"
          variant="sage-light"
          animation="slide-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* Card 1: How It Works */}
            <FeatureCard title="How It Works" icon={Info} iconColor="#3D4F52">
              <ul className="space-y-4">
                <li className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-terracotta uppercase tracking-wider">Step 01</span>
                  <span className="font-bold text-brown">Create an Account</span>
                  <span className="text-sm">Sign up with your basic info to join our trusted community.</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-terracotta uppercase tracking-wider">Step 02</span>
                  <span className="font-bold text-brown">Request or Offer Help</span>
                  <span className="text-sm">Post what you need or browse requests from others.</span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-terracotta uppercase tracking-wider">Step 03</span>
                  <span className="font-bold text-brown">Build Community</span>
                  <span className="text-sm">Become part of a network making caregiving sustainable.</span>
                </li>
              </ul>
            </FeatureCard>

            {/* Card 2: Why Join? */}
            <FeatureCard title="Why Join?" icon={Heart} iconColor="#D8A8A0">
              <p className="mb-6 font-bold text-teal">Are you caring for an aging loved one?</p>
              <ul className="space-y-4">
                {[
                  { title: "Mutual exchange", desc: "Give what you can, receive what you need." },
                  { title: "Flexibility", desc: "Engage when and how you can." },
                  { title: "Learning", desc: "Workshops on topics chosen by members." },
                  { title: "No pressure", desc: "It's okay to mostly need support." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <ShieldCheck className="mt-1 text-sage shrink-0" size={18} />
                    <div>
                      <span className="font-bold block text-brown">{item.title}</span>
                      <span className="text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </FeatureCard>

            {/* Card 3: Kinds of Help */}
            <FeatureCard title="Kinds of Help" icon={Users} iconColor="#BC6547">
              <p className="mb-6 font-medium">Members help each other with:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Health & Caregiving",
                  "Groceries & Meals",
                  "Transportation & Errands",
                  "Household & Yard",
                  "Technology & Admin",
                  "Social & Companionship"
                ].map(item => (
                  <span key={item} className="bg-cream px-4 py-2 rounded-lg text-sm font-bold text-brown border border-terracotta/20">
                    {item}
                  </span>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-brown text-white text-lg px-10 py-4 rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-1 min-h-[56px]"
            >
              Get Started Today
            </Link>
          </div>
        </LandingSection>

        {/* About Section - Text Left, Photo Right with Decorative Frame */}
        <LandingSection
          id="about"
          variant="cream"
          centeredHeader={false}
          className="py-24"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-20">
            {/* Content - Left Side */}
            <div className="md:w-1/2">
              <h2 className="text-brown text-4xl md:text-5xl font-black mb-8">About CARE Collective</h2>
              <div className="space-y-6 text-brown text-lg md:text-xl leading-relaxed font-medium">
                <h3 className="text-2xl font-bold text-teal">Who We Are</h3>
                <p>
                  The CARE (Caregiver Assistance and Resource Exchange) Collective is a network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
                </p>
                <p>
                  The Collective is powered by caregivers themselves, along with students and volunteers who help maintain the site and coordinate outreach and engagement. Together, we are building a space where caregivers find connection, practical help, and the mutual support that makes caregiving sustainable.
                </p>
              </div>
              <Link
                href="/about"
                className="mt-8 text-terracotta font-bold text-lg flex items-center gap-2 hover:gap-3 transition-all group"
              >
                Learn More About Us <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Photo - Right Side with Decorative Frame */}
            <div className="md:w-1/2 w-full mt-8 md:mt-0">
              <div className="relative pb-8">
                {/* Decorative offset frame */}
                <div className="absolute inset-0 bg-tan translate-x-4 translate-y-4 rounded-2xl"></div>

                {/* Photo Container */}
                <div className="relative bg-white p-2 rounded-2xl border border-brown/10 shadow-xl overflow-hidden">
                  <Image
                    src="/images/maureen-portrait.png"
                    alt="Dr. Maureen Templeman, Founder of CARE Collective"
                    width={600}
                    height={500}
                    className="w-full h-auto rounded-xl object-cover"
                    priority
                  />
                </div>

                {/* Caption Box */}
                <div className="absolute -bottom-6 left-6 right-6 bg-white p-6 rounded-xl shadow-lg border-l-4 border-terracotta">
                  <p className="text-brown font-black text-lg">Dr. Maureen Templeman</p>
                  <p className="text-terracotta font-bold text-sm uppercase tracking-wider">Founder</p>
                </div>
              </div>
            </div>
          </div>
        </LandingSection>

        {/* Combined What's Happening + Resources Section */}
        <LandingSection
          id="whats-happening"
          variant="teal-dark"
          centeredHeader={false}
          className="py-24"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Events Column - Left */}
            <div className="flex flex-col h-full">
              <h2 className="text-3xl md:text-4xl font-black mb-10 text-white flex items-center gap-3">
                What&apos;s Happening <Calendar className="text-dusty-rose" strokeWidth={2.5} />
              </h2>
              <div className="flex-grow">
                <WhatsHappeningSection variant="dark" />
              </div>
              <Link
                href="/dashboard"
                className="mt-8 w-full py-4 bg-dusty-rose text-teal text-center font-bold rounded-xl hover:bg-dusty-rose-light transition-colors min-h-[56px] flex items-center justify-center"
              >
                View All in Member Portal
              </Link>
            </div>

            {/* Resources Column - Right */}
            <div className="flex flex-col h-full" id="resources">
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">Community Resources</h2>
              <p className="text-lg text-white/80 mb-10 font-medium">
                Connect with trusted local and regional organizations that offer practical support, guidance, and connection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                {[
                  { name: "Essentials", sub: "Food, housing, everyday needs" },
                  { name: "Well-Being", sub: "Emotional health & support" },
                  { name: "Community", sub: "Local programs & connections" },
                  { name: "Learning", sub: "Training & education" }
                ].map((item) => (
                  <Link
                    key={item.name}
                    href="/resources"
                    className="bg-white text-brown p-6 rounded-xl hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[140px]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-xl">{item.name}</h4>
                      <ChevronRight size={20} className="text-sage-light group-hover:text-terracotta transition-colors" />
                    </div>
                    <p className="text-sm text-brown/70 font-medium">{item.sub}</p>
                  </Link>
                ))}
              </div>
              <Link
                href="/resources"
                className="mt-8 w-full py-4 border-2 border-white/20 text-white text-center font-bold rounded-xl hover:bg-white hover:text-teal transition-colors min-h-[56px] flex items-center justify-center"
              >
                View All Resources
              </Link>
            </div>
          </div>
        </LandingSection>

        {/* Contact Strip Section */}
        <LandingSection
          id="contact-preview"
          variant="cream"
          className="py-20"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-brown/5 text-center">
            <h2 className="text-3xl font-black text-brown mb-3">Get in Touch</h2>
            <p className="text-brown/70 text-lg mb-8 font-medium">Have questions or feedback? We&apos;re here to help.</p>

            <div className="bg-cream inline-flex items-center gap-3 px-6 py-3 rounded-lg mb-8">
              <Mail className="text-terracotta" size={20} />
              <a href="mailto:swmocarecollective@gmail.com" className="font-bold text-brown hover:text-terracotta transition-colors">
                swmocarecollective@gmail.com
              </a>
            </div>

            <div className="block">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-terracotta text-white px-8 py-3 rounded-lg font-bold hover:bg-terracotta/90 transition-colors min-h-[48px]"
              >
                Visit Full Contact Page
              </Link>
            </div>
          </div>
        </LandingSection>
      </main>

      {/* Footer - Matching Mockup */}
      <footer className="bg-navy py-16 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Branding */}
            <div className="space-y-6">
              <h2 className="text-sage-light text-xl font-black tracking-wide">CARE Collective</h2>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                This project was created by Dr. Maureen Templeman, Department of Sociology, Anthropology, and Gerontology at Missouri State University, with support from community partners and funding from the Southern Gerontological Society Innovative Projects Grant.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61582852599484"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-teal transition-colors"
                  aria-label="Visit our Facebook page"
                >
                  <Facebook size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Contact */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-sage-light">Contact</h3>
              <div className="space-y-3 text-white/80 font-medium text-sm">
                <p className="text-white font-bold text-base">Dr. Maureen Templeman</p>
                <p>Springfield, MO</p>
                <a
                  href="mailto:swmocarecollective@gmail.com"
                  className="block hover:text-sage-light transition-colors mt-2"
                >
                  swmocarecollective@gmail.com
                </a>
              </div>
            </div>

            {/* Column 3: Get Started */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-sage-light">Get Started</h3>
              <ul className="space-y-3 text-white/80 font-medium text-sm list-none">
                <li><Link href="/signup" className="hover:text-white transition-colors">Join Community</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Member Login</Link></li>
              </ul>
            </div>

            {/* Column 4: Resources */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-sage-light">Resources</h3>
              <ul className="space-y-3 text-white/80 font-medium text-sm list-none">
                <li><Link href="/help" className="hover:text-white transition-colors">Help & Support</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/40">
            <p>&copy; 2025 CARE Collective - Southwest Missouri. All rights reserved.</p>
            <p>Community mutual support for Southwest Missouri</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
