'use client'

import Link from 'next/link'
import Image from 'next/image'
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
 * Logo image displayed above the main title
 * Uses the actual CARE Collective logo instead of text circle
 */
function HeroLogo(): ReactElement {
  return (
    <div className="flex items-center justify-center mb-10">
      <Image
        src="/logo-textless.png"
        alt="CARE Collective Logo"
        width={160}
        height={160}
        className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-2xl shadow-lg"
        priority
      />
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
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo Image */}
          <div className="animate-fade-in-up">
            <HeroLogo />
          </div>

          {/* Main Headline - Using Display Font, Larger & Bolder */}
          <div className="mb-6 animate-fade-in-up delay-200">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[1.05] tracking-tight">
              <span className="text-brown block">
                Southwest Missouri
              </span>
              <span className="text-brown block">
                CARE Collective
              </span>
            </h1>
          </div>

          {/* CARE Acronym - Larger & Bolder, first letters bold */}
          <div className="mb-8 animate-fade-in-up delay-300">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-brown font-bold">
              <span className="font-extrabold">C</span>aregiver <span className="font-extrabold">A</span>ssistance and <span className="font-extrabold">R</span>esource <span className="font-extrabold">E</span>xchange
            </p>
          </div>

          {/* Description - Larger & Medium Weight */}
          <div className="mb-10 animate-fade-in-up delay-400">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-foreground/90 max-w-3xl mx-auto leading-relaxed font-medium">
              The CARE Collective is a network of family caregivers in Southwest Missouri
              who support each other through practical help and shared resources.
            </p>
          </div>

          {/* CTA Button - Larger */}
          <div className="animate-fade-in-up delay-500">
            <Link 
              href="/signup" 
              className="group inline-flex items-center justify-center bg-sage text-white px-12 py-6 text-xl md:text-2xl font-bold rounded-full hover:bg-sage-dark transition-all duration-300 hover:shadow-xl min-h-[68px]"
            >
              <span>Join Our Community</span>
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
