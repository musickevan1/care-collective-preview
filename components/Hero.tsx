'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement, useState } from 'react'
import AnimatedGradientText from './AnimatedGradientText'
import MouseGradientBackground from './MouseGradientBackground'
import MagneticButton from './MagneticButton'

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
        className="absolute -top-[10%] -left-[15%] w-[60%] h-[90%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.15] hero-blob-enhanced"
        style={{ transform: 'rotate(-10deg)' }}
      />

      {/* Dusty rose blob - bottom right */}
      <div
        className="absolute bottom-[15%] right-[5%] w-[35%] h-[40%] rounded-[50%_50%_50%_50%/50%_50%_50%_50%] bg-dusty-rose opacity-[0.20] hero-blob-float-delayed hero-blob-pulse"
        style={{ transform: 'rotate(10deg)' }}
      />

      {/* Small tan accent - right side */}
      <div
        className="absolute top-[25%] right-[8%] w-[12%] h-[18%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-tan opacity-[0.12] hero-blob-float-slow"
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

  // Use local hero image
  const heroImageUrl = '/hero-image.jpg'

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
      className="relative py-20 md:py-24 lg:py-28 bg-background min-h-[100vh] flex items-center overflow-hidden"
    >
      {/* Organic Blob Background */}
      <HeroBackground />
      <MouseGradientBackground />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Split Layout: Image first on mobile, Text Left/Centered on desktop */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-20">

            {/* Image - appears first on mobile, right on desktop */}
            <div className="animate-fade-in-up lg:animate-fade-in-right flex-shrink-0 lg:order-2" style={{ animationDelay: '150ms' }}>
              <HeroImage />
            </div>

            {/* Text Content - appears second on mobile, left on desktop */}
            <div className="flex-1 text-center sm:text-left lg:order-1 min-w-0">
              {/* Main Headline - Two-part with different styling */}
              <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                {/* "Southwest Missouri" - larger, bolded, closer to CARE */}
                <p className="font-bold text-foreground mb-2 tracking-[0.05em] sm:tracking-[0.1em]" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                  Southwest Missouri
                </p>
                {/* "CARE Collective" - Gradient CARE, light COLLECTIVE */}
                <AnimatedGradientText />
              </div>

               {/* C.A.R.E. Acronym - expanded width */}
               <div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
<p
                    className="tracking-normal sm:tracking-[0.08em] md:tracking-[0.12em] text-accent font-medium"
                    style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)' }}
                  >
                   <span className="font-bold text-sage-dark">C</span>aregiver <span className="font-bold text-sage-dark">A</span>ssistance and <span className="font-bold text-sage-dark">R</span>esource <span className="font-bold text-sage-dark">E</span>xchange
                 </p>
               </div>

               {/* Description - larger text on two lines */}
               <div className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
<p
                    className="text-muted-foreground max-w-2xl mx-auto sm:mx-0 leading-relaxed"
                    style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.625rem)' }}
                  >
                   A network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
                 </p>
               </div>

              {/* CTA Button - With magnetic effect */}
              <div className="mt-10 md:mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <MagneticButton
                  href="/signup"
                  className="group w-full sm:w-auto"
                >
                  <span className="inline-flex items-center justify-center bg-sage text-white px-10 py-5 md:px-12 md:py-6 text-lg md:text-xl lg:text-2xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-2xl ring-4 ring-white/20 min-h-[64px] md:min-h-[72px]">
                    <span>Join Our Community</span>
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
