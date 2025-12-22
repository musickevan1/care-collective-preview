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
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base cream background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Large sage blob - top left */}
      <div 
        className="absolute -top-[10%] -left-[15%] w-[60%] h-[90%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.15]"
        style={{ transform: 'rotate(-10deg)' }}
      />
      
      {/* Dusty rose blob - bottom right */}
      <div 
        className="absolute -bottom-[20%] -right-[10%] w-[45%] h-[55%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-dusty-rose opacity-[0.18]"
        style={{ transform: 'rotate(15deg)' }}
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
      <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-[340px] xl:h-[340px] rounded-full p-2.5 md:p-3 bg-gradient-to-br from-dusty-rose/70 via-dusty-rose/50 to-dusty-rose/30 shadow-2xl">
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
      className="relative pt-20 pb-12 md:pt-24 md:pb-16 lg:pt-28 lg:pb-20 bg-background min-h-[90vh] flex items-center"
    >
      {/* Organic Blob Background */}
      <HeroBackground />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Split Layout: Text Left, Image Right */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-20">
            
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Main Headline */}
              <div className="mb-5 md:mb-6 animate-fade-in-up">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span className="text-brown block">
                    Southwest Missouri
                  </span>
                  <span className="text-sage-dark block mt-1">
                    CARE Collective
                  </span>
                </h1>
              </div>

              {/* CARE Acronym */}
              <div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <p className="text-lg sm:text-xl md:text-2xl text-brown/90 font-semibold tracking-wide">
                  <span className="font-bold text-sage-dark">C</span>aregiver{' '}
                  <span className="font-bold text-sage-dark">A</span>ssistance and{' '}
                  <span className="font-bold text-sage-dark">R</span>esource{' '}
                  <span className="font-bold text-sage-dark">E</span>xchange
                </p>
              </div>

              {/* Description */}
              <div className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <p className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  A network of family caregivers in Southwest Missouri who support 
                  each other through practical help and shared resources.
                </p>
              </div>

              {/* CTA Button */}
              <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <Link 
                  href="/signup" 
                  className="group inline-flex items-center justify-center bg-sage text-white px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 min-h-[56px] md:min-h-[64px]"
                >
                  <span>Join Our Community</span>
                  <svg 
                    className="w-5 h-5 md:w-6 md:h-6 ml-2.5 group-hover:translate-x-1 transition-transform duration-300" 
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
            
            {/* Right: Circular Image */}
            <div className="animate-fade-in-up lg:animate-fade-in-right" style={{ animationDelay: '150ms' }}>
              <HeroImage />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
