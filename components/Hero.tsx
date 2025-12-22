'use client'

import Link from 'next/link'
import { ReactElement, useState } from 'react'

/**
 * Hero background with organic blob shapes
 * - Large sage blob top-left
 * - Dusty-rose blob bottom-right  
 * - Small tan accent blob
 */
function HeroBackground(): ReactElement {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Base cream background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Large sage blob - top left */}
      <div 
        className="absolute -top-[10%] -left-[15%] w-[60%] h-[90%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.15]"
        style={{ transform: 'rotate(-10deg)' }}
      />
      
      {/* Dusty rose blob - bottom right - positioned to stay visible and rounded */}
      <div 
        className="absolute bottom-[5%] right-[3%] w-[40%] h-[45%] rounded-[50%_50%_50%_50%/50%_50%_50%_50%] bg-dusty-rose opacity-[0.20]"
        style={{ transform: 'rotate(10deg)' }}
      />
      
      {/* Small tan accent - right side */}
      <div 
        className="absolute top-[25%] right-[8%] w-[12%] h-[18%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-tan opacity-[0.12]"
        style={{ transform: 'rotate(-5deg)' }}
      />
    </div>
  )
}

/**
 * Circular hero image with decorative dusty-rose ring
 * Inspired by Kinderground's circular photo treatment
 */
function HeroImage(): ReactElement {
  const [imageError, setImageError] = useState(false)
  
  // Stock image #6: Supportive hand hold with warm lighting
  const heroImageUrl = 'https://media.istockphoto.com/id/863549736/photo/youre-in-my-hands-now.jpg?s=612x612&w=0&k=20&c=lZagU37KsLt3hEOKt5v1cAXCvRe-y1eMugsLtxZ_3Lk='
  
  return (
    <div className="relative flex-shrink-0">
      {/* Outer decorative ring - dusty rose gradient */}
      {/* Mobile-first sizing: smaller on mobile, larger on desktop */}
      <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-[320px] lg:h-[320px] xl:w-[360px] xl:h-[360px] 2xl:w-[400px] 2xl:h-[400px] rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 bg-gradient-to-br from-dusty-rose/70 via-dusty-rose/50 to-dusty-rose/30 shadow-2xl">
        {/* Inner image container */}
        <div className="w-full h-full rounded-full overflow-hidden bg-cream shadow-inner">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-sage/10">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-sage/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-sm text-sage-dark font-medium">Caring Together</span>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImageUrl}
              alt="Supportive hands holding - representing care and compassion"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>
      
      {/* Decorative accent circle */}
      <div 
        className="absolute -bottom-3 -left-3 w-16 h-16 md:w-20 md:h-20 rounded-full bg-sage/20 -z-10"
        aria-hidden="true"
      />
    </div>
  )
}

export default function Hero(): ReactElement {
  return (
    <section 
      id="home" 
      className="relative py-12 md:py-8 lg:pt-28 lg:pb-8 bg-background min-h-[auto] lg:min-h-[80vh] flex items-center overflow-hidden"
    >
      {/* Organic Blob Background */}
      <HeroBackground />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Split Layout: Image first on mobile (flex-col-reverse), Text Left on desktop */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Main Headline - EXTRA LARGE & BOLD */}
              <div className="mb-3 md:mb-4 animate-fade-in-up">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[100px] xl:text-[140px] 2xl:text-[180px] font-black leading-[0.95] tracking-tighter">
                  <span className="text-brown block">
                    Southwest Missouri
                  </span>
                  <span className="text-sage-dark block mt-1">
                    CARE Collective
                  </span>
                </h1>
              </div>

              {/* CTA Button - Moved up for visual priority */}
              <div className="mb-5 md:mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <Link 
                  href="/signup" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center bg-sage text-white px-12 py-6 md:px-16 md:py-7 text-2xl md:text-3xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 min-h-[72px] md:min-h-[80px]"
                >
                  <span>Join Our Community</span>
                  <svg 
                    className="w-7 h-7 md:w-8 md:h-8 ml-3 group-hover:translate-x-1 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* CARE Acronym */}
              <div className="mb-4 md:mb-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-[28px] xl:text-[32px] text-brown/90 font-semibold tracking-wide">
                  <span className="font-bold text-sage-dark">C</span>aregiver{' '}
                  <span className="font-bold text-sage-dark">A</span>ssistance and{' '}
                  <span className="font-bold text-sage-dark">R</span>esource{' '}
                  <span className="font-bold text-sage-dark">E</span>xchange
                </p>
              </div>

              {/* Description */}
              <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-[22px] xl:text-2xl text-foreground/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  A network of family caregivers in Southwest Missouri who support 
                  each other through practical help and shared resources.
                </p>
              </div>
            </div>
            
            {/* Right: Circular Image - appears first on mobile due to flex-col-reverse */}
            <div className="animate-fade-in-up lg:animate-fade-in-right flex-shrink-0" style={{ animationDelay: '150ms' }}>
              <HeroImage />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
