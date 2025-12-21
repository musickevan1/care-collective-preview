'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

/**
 * Organic blob SVG shapes for hero background
 * Matches the wireframe design with large, soft-edged shapes
 */
function HeroBlobs(): ReactElement {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large sage blob - top left area */}
      <svg
        className="absolute -top-20 -left-20 w-[600px] h-[600px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px] hero-blob-float"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M450,200 Q550,100 500,250 Q600,350 500,400 Q550,500 400,480 Q300,550 200,450 Q100,400 150,300 Q50,200 200,150 Q300,50 400,150 Q450,100 450,200 Z"
          fill="#7A9E99"
          fillOpacity="0.08"
        />
      </svg>
      
      {/* Large dusty rose blob - bottom right area */}
      <svg
        className="absolute -bottom-32 -right-20 w-[500px] h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] hero-blob-float-delayed"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M300,100 Q450,50 500,200 Q580,300 500,400 Q450,520 300,500 Q150,520 100,400 Q20,300 100,200 Q150,50 300,100 Z"
          fill="#D8A8A0"
          fillOpacity="0.07"
        />
      </svg>

      {/* Small terracotta accent blob - middle right */}
      <svg
        className="absolute top-1/3 right-10 w-[150px] h-[150px] md:w-[200px] md:h-[200px] hero-blob-float-slow"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100,30 Q150,20 170,80 Q190,130 150,160 Q100,190 60,150 Q20,110 50,70 Q70,30 100,30 Z"
          fill="#BC6547"
          fillOpacity="0.05"
        />
      </svg>

      {/* Small sage accent blob - bottom left */}
      <svg
        className="absolute bottom-20 left-1/4 w-[120px] h-[120px] md:w-[180px] md:h-[180px] hero-blob-float-delayed"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100,40 Q140,30 160,80 Q180,120 140,160 Q100,180 60,140 Q30,100 60,60 Q80,40 100,40 Z"
          fill="#7A9E99"
          fillOpacity="0.06"
        />
      </svg>
    </div>
  )
}

export default function Hero(): ReactElement {
  const handleSmoothScroll = useSmoothScroll()

  return (
    <section id="home" className="relative pt-24 pb-20 md:pt-28 md:pb-24 bg-background overflow-hidden min-h-[90vh] flex items-center">
      {/* Organic Blob Background */}
      <HeroBlobs />

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
