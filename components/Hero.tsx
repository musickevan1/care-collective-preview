'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

/**
 * Hero background with organic blob shapes matching the wireframe
 * - Large sage blob extending from top-left corner
 * - Large dusty-rose blob extending from bottom-right corner
 * - Layered for watercolor depth effect
 */
function HeroBackground(): ReactElement {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base cream background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* SVG blob container - covers full hero area */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Sage blob - Top Left - extends off screen */}
        <g className="sage-blob">
          {/* Primary shape - more visible */}
          <path
            d="M-200 -100
               C -100 100, 50 200, 200 280
               C 350 360, 480 420, 550 520
               C 620 620, 580 720, 450 700
               C 320 680, 200 600, 100 480
               C 0 360, -80 220, -120 100
               C -160 -20, -180 -80, -200 -100
               Z"
            fill="#7A9E99"
            fillOpacity="0.35"
          />
          {/* Secondary layer for depth/watercolor effect */}
          <path
            d="M-150 -50
               C -50 80, 80 160, 180 240
               C 280 320, 380 380, 440 460
               C 500 540, 480 620, 380 620
               C 280 620, 180 560, 100 460
               C 20 360, -40 240, -80 140
               C -120 40, -140 -20, -150 -50
               Z"
            fill="#7A9E99"
            fillOpacity="0.2"
          />
        </g>

        {/* Dusty Rose blob - Bottom Right - extends off screen */}
        <g className="rose-blob">
          {/* Primary shape - more visible */}
          <path
            d="M1640 1000
               C 1540 880, 1420 780, 1280 700
               C 1140 620, 980 580, 860 520
               C 740 460, 680 380, 720 300
               C 760 220, 880 200, 1020 240
               C 1160 280, 1300 360, 1420 460
               C 1540 560, 1600 680, 1640 820
               C 1680 960, 1660 1000, 1640 1000
               Z"
            fill="#D8A8A0"
            fillOpacity="0.4"
          />
          {/* Secondary layer for depth */}
          <path
            d="M1620 980
               C 1540 860, 1440 780, 1320 720
               C 1200 660, 1060 620, 960 560
               C 860 500, 820 420, 860 360
               C 900 300, 1000 300, 1120 340
               C 1240 380, 1360 440, 1460 520
               C 1560 600, 1600 700, 1620 820
               C 1640 940, 1620 980, 1620 980
               Z"
            fill="#D8A8A0"
            fillOpacity="0.25"
          />
        </g>
      </svg>
    </div>
  )
}

export default function Hero(): ReactElement {
  const handleSmoothScroll = useSmoothScroll()

  return (
    <section id="home" className="relative pt-24 pb-20 md:pt-28 md:pb-24 bg-background overflow-hidden min-h-[90vh] flex items-center">
      {/* Organic Blob Background */}
      <HeroBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo and Brand Section */}
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-sage/30 via-dusty-rose/30 to-terracotta/30 rounded-full blur-xl"></div>
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={180}
                height={180}
                className="relative rounded-full shadow-xl hover:scale-[1.02] transition-transform duration-200 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44"
                priority
                sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 176px"
              />
            </div>
          </div>

          {/* Main Headline - Ultra Bold, Large */}
          <div className="mb-6 animate-fade-in-up delay-200">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] font-black leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-sage via-dusty-rose-dark to-terracotta bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                Southwest Missouri
              </span>
              <br />
              <span className="text-brown block mt-2">
                CARE Collective
              </span>
            </h1>
          </div>

          {/* Subtitle - CARE Acronym */}
          <div className="mb-8 animate-fade-in-up delay-300">
            <p className="text-xl sm:text-2xl md:text-[26px] text-sage-dark font-semibold tracking-wide">
              <span className="font-bold">C</span>ARE<span className="font-normal">giver</span>{' '}
              <span className="font-bold">A</span><span className="font-normal">ssistance and</span>{' '}
              <span className="font-bold">R</span><span className="font-normal">esource</span>{' '}
              <span className="font-bold">E</span><span className="font-normal">xchange</span>
            </p>
            <div className="w-28 h-1.5 bg-gradient-to-r from-dusty-rose via-sage to-terracotta mx-auto rounded-full mt-5"></div>
          </div>

          {/* Description - Larger text */}
          <div className="mb-12 animate-fade-in-up delay-400">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-[22px] text-foreground/80 max-w-4xl mx-auto leading-relaxed">
              The CARE Collective is a network of family caregivers in Southwest Missouri
              who support each other through practical help and shared resources.
            </p>
          </div>

          {/* Enhanced CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-500">
            <Link 
              href="/signup" 
              className="group relative inline-flex items-center justify-center bg-sage text-white px-10 py-5 text-lg md:text-xl font-bold rounded-2xl hover:bg-sage-dark transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl min-h-[60px] overflow-hidden"
            >
              <span className="relative flex items-center gap-3">
                <span>Join Our Community</span>
                <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-fade-in-up delay-600">
            <Link
              href="#what-is-care"
              onClick={handleSmoothScroll}
              className="inline-flex flex-col items-center text-sage-dark hover:text-sage transition-all duration-300 group"
              aria-label="Scroll to learn about CARE Collective"
            >
              <span className="text-sm font-medium mb-2 opacity-70 group-hover:opacity-100">Learn More</span>
              <svg className="w-6 h-6 animate-bounce opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
