'use client'

import Link from 'next/link'
import { ReactElement } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export default function Hero(): ReactElement {
  const handleSmoothScroll = useSmoothScroll()

  return (
    <section id="home" className="relative pt-24 pb-20 md:pt-28 md:pb-32 bg-gradient-to-br from-background to-sage-light/10 overflow-hidden">
      {/* Subtle background gradient overlay - keeping minimal visual interest */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-sage rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-dusty-rose rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl text-center md:text-left">
          {/* Main Headline - Mockup Style */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-[96px] font-black leading-[1.05] tracking-tight">
              <span className="text-brown block">
                Southwest Missouri
              </span>
              <span className="text-terracotta block mt-2">
                CARE Collective
              </span>
            </h1>
          </div>

          {/* Subtitle - CARE Acronym with terracotta letters */}
          <div className="mb-8">
            <p className="text-lg md:text-xl lg:text-2xl text-brown font-bold tracking-wide">
              <span className="text-terracotta">C</span>aregiver{' '}
              <span className="text-terracotta">A</span>ssistance and{' '}
              <span className="text-terracotta">R</span>esource{' '}
              <span className="text-terracotta">E</span>xchange
            </p>
          </div>

          {/* Description */}
          <div className="mb-10">
            <p className="text-lg md:text-xl lg:text-2xl text-brown max-w-2xl leading-relaxed font-medium">
              The CARE Collective is a network of family caregivers in Southwest Missouri
              who support each other through practical help and shared resources.
            </p>
          </div>

          {/* CTA Button - Single sage button */}
          <div className="flex flex-col md:flex-row gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-sage text-white text-lg px-8 py-4 rounded-xl font-bold hover:bg-sage-dark hover:translate-y-[-2px] transition-all duration-200 shadow-md min-h-[56px]"
            >
              Join Our Community
            </Link>
          </div>
        </div>
      </div>

      {/* Simplified scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <Link
          href="#what-is-care"
          onClick={handleSmoothScroll}
          className="inline-block text-brown/40 hover:text-brown/60 transition-colors"
          aria-label="Scroll to learn more"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
