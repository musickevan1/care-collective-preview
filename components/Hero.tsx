'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export default function Hero(): ReactElement {
  const handleSmoothScroll = useSmoothScroll()

  return (
    <section id="home" className="relative pt-24 pb-20 bg-gradient-to-br from-background via-background to-sage-light/20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sage rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-dusty-rose rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-terracotta rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-sage-dark rounded-full blur-xl animate-pulse delay-3000"></div>
      </div>

      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-3">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="currentColor" className="text-sage"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo and Brand Section */}
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-sage via-dusty-rose to-terracotta rounded-full opacity-20 blur-lg animate-pulse"></div>
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={160}
                height={160}
                className="relative rounded-full shadow-lg hover:scale-[1.02] transition-transform duration-200 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40"
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
              />
            </div>
          </div>

          {/* Main Headline with Gradient Effect */}
          <div className="mb-6 animate-fade-in-up delay-200">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-tight">
              <span className="bg-gradient-to-r from-sage via-dusty-rose-dark to-terracotta bg-clip-text text-transparent animate-gradient-x">
                Southwest Missouri
              </span>
              <br />
              <span className="text-foreground mt-2 block">
                CARE Collective
              </span>
            </h1>
          </div>

          {/* Subtitle with Enhanced Typography */}
          <div className="mb-8 animate-fade-in-up delay-300">
            <p className="text-xl md:text-3xl lg:text-4xl text-sage-dark mb-4 font-bold tracking-wide">
              Building community through mutual support
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-dusty-rose to-sage mx-auto rounded-full"></div>
          </div>

          {/* Description with Better Spacing */}
          <div className="mb-10 animate-fade-in-up delay-400">
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              A community for caregivers to exchange practical help, shared resources, and mutual support. 
              Together, we're building a space where caregivers can find connection, strength, and the support they deserve.
            </p>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-500">
            <Link 
              href="/signup" 
              className="group relative inline-flex items-center justify-center bg-gradient-to-r from-sage to-sage-dark text-white px-10 py-5 text-lg font-bold rounded-xl hover:scale-[1.02] transition-all duration-200 transform hover:shadow-lg min-h-[56px] overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-sage-dark to-sage opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center gap-3">
                <span>Join Our Community</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>

            <Link
              href="#how-it-works"
              onClick={handleSmoothScroll}
              className="group relative inline-flex items-center justify-center bg-white/90 backdrop-blur-sm text-sage-dark px-10 py-5 text-lg font-bold rounded-xl hover:bg-white hover:scale-[1.02] transition-all duration-200 transform hover:shadow-lg border-2 border-sage/20 hover:border-sage/40 min-h-[56px]"
            >
              <span className="flex items-center gap-3">
                <span>Learn How It Works</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Community stats removed - will be added when real data is available */}

          {/* Scroll Indicator */}
          <div className="mt-12 animate-pulse">
            <Link
              href="#how-it-works"
              onClick={handleSmoothScroll}
              className="inline-block text-sage-dark hover:text-sage transition-all duration-300 hover:scale-110"
              aria-label="Scroll to learn how it works"
            >
              <svg className="w-6 h-6 mx-auto opacity-60 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}