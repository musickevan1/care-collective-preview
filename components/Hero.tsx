'use client'

import Link from 'next/link'
import { ReactElement } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

/**
 * Hero background matching the wireframe exactly:
 * - Large sage blob top-left (extends off-screen)
 * - Smaller dusty-rose blob bottom-right (extends off-screen)  
 * - Small tan accent blob on right side
 */
function HeroBackground(): ReactElement {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Base cream background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Large sage blob - top left, extends off screen and into next section
          Using bottom positioning to allow natural overflow into the next section */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[55%] h-[85%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-sage opacity-[0.18]"
        style={{ transform: 'rotate(-10deg)' }}
      />
      
      {/* Dusty rose blob - bottom right, extends off screen */}
      <div 
        className="absolute -bottom-[15%] -right-[10%] w-[40%] h-[50%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-dusty-rose opacity-[0.20]"
        style={{ transform: 'rotate(15deg)' }}
      />
      
      {/* Small tan/terracotta accent - right side middle */}
      <div 
        className="absolute top-[30%] right-[5%] w-[15%] h-[20%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-tan opacity-[0.15]"
        style={{ transform: 'rotate(-5deg)' }}
      />
    </div>
  )
}

/**
 * Circular text badge matching wireframe - NOT the logo image
 * Shows "CARE" and "Collective" inside a circular outline
 */
function CareBadge(): ReactElement {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-2 border-sage-dark flex flex-col items-center justify-center">
        <span className="text-sage-dark text-2xl sm:text-3xl md:text-4xl font-bold leading-none">CARE</span>
        <span className="text-sage-dark text-sm sm:text-base md:text-lg font-normal leading-tight">Collective</span>
      </div>
    </div>
  )
}

export default function Hero(): ReactElement {
  const handleSmoothScroll = useSmoothScroll()

  return (
    <section id="home" className="relative pt-24 pb-16 md:pt-28 md:pb-20 bg-background min-h-[85vh] flex items-center">
      {/* Organic Blob Background - overflow visible to blend into next section */}
      <HeroBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Circular CARE Badge - text only, not logo */}
          <div className="animate-fade-in-up">
            <CareBadge />
          </div>

          {/* Main Headline */}
          <div className="mb-4 animate-fade-in-up delay-200">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-brown block">
                Southwest Missouri
              </span>
              <span className="text-brown block">
                CARE Collective
              </span>
            </h1>
          </div>

          {/* CARE Acronym - single line */}
          <div className="mb-6 animate-fade-in-up delay-300">
            <p className="text-base sm:text-lg md:text-xl text-brown font-medium">
              <span className="font-bold">CARE</span>giver Assistance and Resource Exchange
            </p>
          </div>

          {/* Description */}
          <div className="mb-8 animate-fade-in-up delay-400">
            <p className="text-sm sm:text-base md:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              The CARE Collective is a network of family caregivers in Southwest Missouri
              who support each other through practical help and shared resources.
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in-up delay-500">
            <Link 
              href="/signup" 
              className="group inline-flex items-center justify-center bg-sage text-white px-8 py-4 text-base md:text-lg font-semibold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-lg min-h-[52px]"
            >
              <span>Join Our Community</span>
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
