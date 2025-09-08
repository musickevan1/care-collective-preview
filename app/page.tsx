'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import Hero from '@/components/Hero'
import { MobileNav } from '@/components/MobileNav'
import { useAuthNavigation } from '@/lib/hooks/useAuthNavigation'

export default function HomePage(): ReactElement {
  const { isAuthenticated, displayName, isLoading } = useAuthNavigation()

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#mobile-navigation-menu" className="skip-link">
        Skip to navigation
      </a>
      
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
        <nav className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="CARE Collective Logo" 
                width={32} 
                height={32}
                className="rounded"
                priority
                sizes="32px"
              />
              <span className="text-lg sm:text-xl font-bold truncate">CARE Collective</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center">
              <ul className="flex items-center gap-3 xl:gap-4 list-none">
                <li><Link href="#home" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">Home</Link></li>
                <li><Link href="#mission" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">Mission</Link></li>
                <li><Link href="#how-it-works" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">How It Works</Link></li>
                <li><Link href="#whats-happening" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base whitespace-nowrap">What's Happening</Link></li>
                <li><Link href="#about" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">About</Link></li>
                <li><Link href="#contact" className="hover:text-sage-light transition-colors py-2 px-2 xl:px-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy text-sm xl:text-base">Contact</Link></li>
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
                    <button type="submit" className="bg-destructive text-destructive-foreground px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-destructive/90 transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-destructive/50 min-h-[44px] flex items-center text-sm xl:text-base">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/signup" className="border border-sage text-sage px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-sage/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage-light min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap">Join Community</Link>
                  <Link href="/login" className="bg-sage text-white px-3 xl:px-4 py-2 rounded-lg font-semibold hover:bg-sage-dark transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage-light min-h-[44px] flex items-center text-sm xl:text-base whitespace-nowrap">Member Login</Link>
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

        {/* Mission Section */}
        <section id="mission" className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Our Mission
              </h2>
              <p className="text-xl font-medium text-foreground mb-12 max-w-3xl mx-auto">
                To connect caregivers with one another for the exchange of practical help, 
                shared resources, and mutual support.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                <div className="text-center p-6 border-2 border-sage-light rounded-lg hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-sage transition-all">
                  <div className="text-5xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Community</h3>
                  <p className="text-muted-foreground">Building real connections between neighbors</p>
                </div>
                <div className="text-center p-6 border-2 border-sage-light rounded-lg hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-sage transition-all">
                  <div className="text-5xl mb-4">💖</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Support</h3>
                  <p className="text-muted-foreground">Practical help when you need it most</p>
                </div>
                <div className="text-center p-6 border-2 border-sage-light rounded-lg hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-sage transition-all">
                  <div className="text-5xl mb-4">🌟</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Trust</h3>
                  <p className="text-muted-foreground">Safe and welcoming environment</p>
                </div>
                <div className="text-center p-6 border-2 border-sage-light rounded-lg hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-sage transition-all">
                  <div className="text-5xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Growth</h3>
                  <p className="text-muted-foreground">Stronger communities through mutual aid</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20 bg-gradient-to-br from-sage-light to-green-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="text-5xl mb-6 mt-4">👥</div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Join the Community</h3>
                  <p className="text-muted-foreground">
                    Sign up with your basic information to become part of our trusted community network.
                  </p>
                </div>
                
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="text-5xl mb-6 mt-4">🙋‍♀️</div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Request or Offer Help</h3>
                  <p className="text-muted-foreground">
                    Post what you need help with, or browse requests to see how you can assist others.
                  </p>
                </div>
                
                <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:transform hover:-translate-y-3 hover:shadow-2xl transition-all relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="text-5xl mb-6 mt-4">🤝</div>
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

        {/* What's Happening Section */}
        <section id="whats-happening" className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                What's Happening
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-4xl mx-auto text-left">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-sage-light">
                    Upcoming Events
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-background rounded-lg border-l-4 border-dusty-rose">
                      <div className="bg-sage text-white px-3 py-2 rounded text-sm font-semibold text-center min-w-[60px] flex-shrink-0">
                        Jan 15
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Community Meet & Greet</h4>
                        <p className="text-muted-foreground">Join us for coffee and connection</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-background rounded-lg border-l-4 border-dusty-rose">
                      <div className="bg-sage text-white px-3 py-2 rounded text-sm font-semibold text-center min-w-[60px] flex-shrink-0">
                        Jan 22
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Resource Sharing Workshop</h4>
                        <p className="text-muted-foreground">Learn about mutual aid principles</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-sage-light">
                    Community Updates
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-background rounded-lg border-l-4 border-dusty-rose">
                      <h4 className="text-lg font-semibold text-foreground mb-1">Welcome New Members!</h4>
                      <p className="text-muted-foreground">15 new community members joined this week</p>
                    </div>
                    <div className="p-4 bg-background rounded-lg border-l-4 border-dusty-rose">
                      <h4 className="text-lg font-semibold text-foreground mb-1">Help Requests Fulfilled</h4>
                      <p className="text-muted-foreground">23 successful connections made this month</p>
                    </div>
                  </div>
                </div>
              </div>
              
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

        {/* About Section */}
        <section id="about" className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                About
              </h2>
              <div className="max-w-4xl mx-auto text-left">
                <div className="mb-8">
                  <p className="text-lg leading-relaxed text-foreground mb-6">
                    The CARE Collective (Caregiver Assistance and Resource Exchange) is a community for 
                    caregivers in Southwest Missouri. The Collective is powered by caregivers themselves - 
                    neighbors supporting neighbors - along with students and volunteers who help maintain 
                    the site and coordinate resources.
                  </p>
                  <p className="text-lg leading-relaxed text-foreground">
                    Together, we are building a space where caregivers can find connection, strength, 
                    and the support they deserve.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border-2 border-dusty-rose-light border-l-6 border-l-dusty-rose">
                  <h3 className="text-xl font-bold text-dusty-rose-dark mb-4">Academic Partnership</h3>
                  <p className="text-muted-foreground italic">
                    This project was created by Dr. Maureen Templeman, Department of Sociology, 
                    Anthropology, and Gerontology at Missouri State University, with support from 
                    community partners and funding from the Southern Gerontological Society 
                    Innovative Projects Grant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-navy text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
            <div>
              <h3 className="text-xl font-bold text-sage-light mb-6">Contact Information</h3>
              <p className="mb-2">
                <strong>Email:</strong> {' '}
                <a href="mailto:swmocarecollective@gmail.com" className="text-white hover:text-sage-light transition-colors focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded px-1 py-0.5">
                  swmocarecollective@gmail.com
                </a>
              </p>
              <p><strong>Location:</strong> Springfield, 65897</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-sage-light mb-6">Quick Links</h3>
              <ul className="space-y-2 list-none">
                <li><Link href="/login" className="text-white hover:text-sage-light transition-colors inline-block py-1 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded px-2">Member Login</Link></li>
                <li><Link href="/signup" className="text-white hover:text-sage-light transition-colors inline-block py-1 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded px-2">Join Community</Link></li>
                <li><Link href="#contact" className="text-white hover:text-sage-light transition-colors inline-block py-1 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded px-2">Contact Us</Link></li>
                <li><Link href="/dashboard" className="text-white hover:text-sage-light transition-colors inline-block py-1 focus:outline-none focus:ring-2 focus:ring-sage-light focus:ring-offset-2 focus:ring-offset-navy rounded px-2">Member Portal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/70">&copy; 2025 CARE Collective - Southwest Missouri</p>
          </div>
        </div>
      </footer>
    </div>
  )
}