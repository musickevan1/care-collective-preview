'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ReactElement } from 'react'

export default function Hero(): ReactElement {
  return (
    <section id="home" className="relative pt-32 pb-24 bg-gradient-to-br from-cream via-cream to-teal/10 overflow-hidden min-h-[85vh] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="currentColor" className="text-teal" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo and Brand Section */}
          <div className="flex items-center justify-center gap-4 mb-10 animate-fade-in-up">
            <div className="relative">
              <Image
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                width={180}
                height={180}
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
                priority
                sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
              />
            </div>
          </div>

          {/* Main Headline */}
          <div className="mb-8 animate-fade-in-up delay-200">
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black leading-[1.1] text-brown tracking-tight">
              Southwest Missouri
              <br />
              <span className="text-teal">CARE Collective</span>
            </h1>
          </div>

          {/* Subtitle - CARE Acronym */}
          <div className="mb-10 animate-fade-in-up delay-300">
            <p className="text-xl md:text-2xl lg:text-3xl text-brown/90 mb-6 font-semibold tracking-wide">
              Caregiver Assistance and Resource Exchange
            </p>
            <div className="w-32 h-1.5 bg-gradient-to-r from-teal to-rose mx-auto rounded-full opacity-80"></div>
          </div>

          {/* Description */}
          <div className="mb-12 animate-fade-in-up delay-400">
            <p className="text-xl md:text-2xl text-brown/80 max-w-3xl mx-auto leading-relaxed font-medium">
              Connecting caregivers who understand each other's challenges and can offer mutual support.
            </p>
          </div>

          {/* Single CTA Button - Teal */}
          <div className="flex justify-center items-center animate-fade-in-up delay-500">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center bg-teal text-white px-12 py-6 text-xl md:text-2xl font-bold rounded-2xl hover:bg-teal/90 hover:scale-[1.02] transition-all duration-300 transform hover:shadow-xl min-h-[64px] shadow-lg shadow-teal/20"
            >
              <span className="relative flex items-center gap-3">
                <span>Join Our Community</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}