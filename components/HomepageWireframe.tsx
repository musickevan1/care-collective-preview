'use client'

import { ReactElement } from 'react'

/**
 * HomepageWireframe - Low-fidelity skeleton wireframe of the homepage
 * 
 * This component shows the structural layout and background shapes
 * without any text, icons, or interactive elements. Use this for:
 * - Planning background shape implementations
 * - Understanding section layouts
 * - Design system reference
 * 
 * Color coding:
 * - Gray dashed borders: Content placeholders
 * - Colored shapes: Background decorative elements
 * - Light gray backgrounds: Section backgrounds
 */

// ============================================
// SECTION 1: HERO
// ============================================
function HeroWireframe(): ReactElement {
  return (
    <section className="relative min-h-[85vh] bg-[#FBF2E9] overflow-hidden">
      {/* Background Blobs - contained within hero */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large sage blob - top left
            Mobile: smaller, more contained
            Desktop: larger, extends off-screen */}
        <div 
          className="absolute bg-[#7A9E99] opacity-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%]
            -top-[5%] -left-[15%] w-[70%] h-[50%]
            sm:-top-[8%] sm:-left-[12%] sm:w-[60%] sm:h-[60%]
            md:-top-[10%] md:-left-[10%] md:w-[55%] md:h-[70%]"
          style={{ transform: 'rotate(-10deg)' }}
        />
        
        {/* Dusty rose blob - bottom right corner
            Mobile: subtle corner accent
            Desktop: larger, more prominent */}
        <div 
          className="absolute bg-[#D8A8A0] rounded-[60%_40%_30%_70%/50%_60%_40%_50%]
            bottom-[-5%] right-[-10%] w-[50%] h-[35%] opacity-15
            sm:bottom-[-8%] sm:right-[-8%] sm:w-[45%] sm:h-[40%] sm:opacity-20
            md:bottom-[-10%] md:right-[-5%] md:w-[40%] md:h-[45%] md:opacity-25"
          style={{ transform: 'rotate(10deg)' }}
        />
        
        {/* Small tan accent - right side middle
            Hidden on mobile, visible on tablet+ */}
        <div 
          className="absolute bg-[#C39778] opacity-15 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]
            hidden md:block
            md:top-[25%] md:right-[8%] md:w-[12%] md:h-[15%]
            lg:top-[30%] lg:right-[5%] lg:w-[15%] lg:h-[20%] lg:opacity-20"
          style={{ transform: 'rotate(-5deg)' }}
        />
      </div>

      {/* Content Skeleton */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 pt-24">
        {/* CARE Badge Circle */}
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-400 mb-8" />
        
        {/* Title lines */}
        <div className="w-72 h-8 bg-gray-300 rounded mb-3" />
        <div className="w-56 h-8 bg-gray-300 rounded mb-6" />
        
        {/* Subtitle line */}
        <div className="w-64 h-4 bg-gray-200 rounded mb-4" />
        
        {/* Description lines */}
        <div className="w-96 max-w-full h-3 bg-gray-200 rounded mb-2" />
        <div className="w-80 max-w-full h-3 bg-gray-200 rounded mb-8" />
        
        {/* CTA Button */}
        <div className="w-44 h-12 bg-gray-300 rounded-full" />
      </div>
    </section>
  )
}

// ============================================
// SECTION 2: WHAT IS CARE COLLECTIVE
// ============================================
function WhatIsCareWireframe(): ReactElement {
  return (
    <section className="relative">
      {/* Section Title Area - Cream background */}
      <div className="bg-[#FBF2E9] py-16">
        <div className="flex justify-center">
          <div className="w-80 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Cards Area - Dusty Rose background with wave dividers */}
      <div className="bg-[#D8A8A0]/20 relative py-24">
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 Q720,0 1440,60 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
              style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }}
            />
          </svg>
        </div>

        {/* Three Column Card Layout */}
        <div className="container mx-auto px-4 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1: How It Works */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="w-32 h-6 bg-gray-300 rounded mx-auto mb-8" />
              {/* Steps */}
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-300 rounded mb-2" />
                    <div className="w-full h-3 bg-gray-200 rounded mb-1" />
                    <div className="w-3/4 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
              {/* CTA Button */}
              <div className="w-36 h-12 bg-gray-300 rounded-xl mx-auto mt-8" />
            </div>

            {/* Card 2: Why Join - Featured */}
            <div className="bg-white rounded-3xl p-8 shadow-lg ring-2 ring-[#7A9E99]/30">
              <div className="w-24 h-6 bg-gray-300 rounded mx-auto mb-6" />
              <div className="w-full h-3 bg-gray-200 rounded mb-2 mx-auto" />
              <div className="w-3/4 h-3 bg-gray-200 rounded mb-8 mx-auto" />
              {/* Benefit Items */}
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-28 h-4 bg-gray-300 rounded mb-1" />
                    <div className="w-full h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
              {/* CTA Button */}
              <div className="w-40 h-12 bg-gray-300 rounded-xl mx-auto mt-8" />
            </div>

            {/* Card 3: Kinds of Help */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="w-32 h-6 bg-gray-300 rounded mx-auto mb-6" />
              <div className="w-40 h-3 bg-gray-200 rounded mx-auto mb-8" />
              {/* Help Categories - 6 items */}
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="flex items-center gap-4 p-3 rounded-xl mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="w-36 h-4 bg-gray-300 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 Q720,0 1440,60 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SECTION 3: ABOUT CARE COLLECTIVE
// ============================================
function AboutWireframe(): ReactElement {
  return (
    <section className="relative">
      {/* Section Title - Cream background */}
      <div className="bg-[#FBF2E9] py-16">
        <div className="flex justify-center">
          <div className="w-72 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Content - Sage background with organic divider */}
      <div className="bg-[#5A7E79] relative py-24">
        {/* Organic Top Divider */}
        <div className="absolute top-0 left-0 right-0 h-20">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,50 C180,70 360,20 540,45 C720,70 900,30 1080,55 C1260,80 1380,40 1440,50 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
              style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }}
            />
          </svg>
        </div>

        {/* Two-Column Layout */}
        <div className="container mx-auto px-4 pt-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-5xl mx-auto">
            {/* Left: Portrait Circle */}
            <div className="flex-shrink-0">
              <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-full p-2 bg-[#D8A8A0]/50">
                <div className="w-full h-full rounded-full bg-gray-300" />
              </div>
              <div className="w-40 h-4 bg-gray-400/50 rounded mx-auto mt-6" />
            </div>

            {/* Right: Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Icon + Heading */}
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-white/20" />
                <div className="w-32 h-8 bg-gray-300/50 rounded" />
              </div>
              
              {/* Description lines */}
              <div className="w-full h-4 bg-gray-300/50 rounded mb-3" />
              <div className="w-full h-4 bg-gray-300/50 rounded mb-3" />
              <div className="w-3/4 h-4 bg-gray-300/50 rounded mb-10" />
              
              {/* Highlighted text */}
              <div className="w-80 max-w-full h-6 bg-gray-300/50 rounded mb-8" />
              
              {/* CTA Button */}
              <div className="w-48 h-12 bg-[#FBF2E9] rounded-xl mx-auto lg:mx-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SECTION 4: WHAT'S HAPPENING
// ============================================
function WhatsHappeningWireframe(): ReactElement {
  return (
    <section className="relative">
      {/* Section Title - Cream background */}
      <div className="bg-[#FBF2E9] py-16">
        <div className="flex justify-center">
          <div className="w-56 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Content - Sage/15% background with wave dividers */}
      <div className="bg-[#7A9E99]/15 relative py-24">
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
              style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }}
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 pt-8">
          {/* Subtitle */}
          <div className="w-72 h-4 bg-gray-200 rounded mx-auto mb-12" />
          
          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-white rounded-2xl p-6 shadow-md">
                {/* Image placeholder */}
                <div className="w-full h-32 bg-gray-200 rounded-xl mb-4" />
                {/* Title */}
                <div className="w-3/4 h-4 bg-gray-300 rounded mb-2" />
                {/* Description */}
                <div className="w-full h-3 bg-gray-200 rounded mb-1" />
                <div className="w-2/3 h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <div className="w-56 h-14 bg-gray-300 rounded-xl" />
          </div>
        </div>

        {/* Bottom Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SECTION 5: COMMUNITY RESOURCES
// ============================================
function ResourcesWireframe(): ReactElement {
  return (
    <section className="bg-[#FBF2E9] py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="w-64 h-10 bg-gray-300 rounded mx-auto mb-6" />
          <div className="w-96 max-w-full h-4 bg-gray-200 rounded mx-auto mb-2" />
          <div className="w-80 max-w-full h-4 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Resource Category Cards - 2x3 or 3x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-12">
          {[1, 2, 3, 4, 5, 6].map((card) => (
            <div key={card} className="bg-white rounded-2xl p-6 shadow-md text-center">
              {/* Icon */}
              <div className="w-14 h-14 bg-gray-200 rounded-xl mx-auto mb-4" />
              {/* Title */}
              <div className="w-20 h-4 bg-gray-300 rounded mx-auto mb-2" />
              {/* Subtitle */}
              <div className="w-16 h-3 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <div className="w-48 h-14 bg-gray-300 rounded-xl" />
        </div>
      </div>
    </section>
  )
}

// ============================================
// SECTION 6: GET IN TOUCH
// ============================================
function ContactWireframe(): ReactElement {
  return (
    <section className="relative">
      {/* Navy background */}
      <div className="bg-[#324158] relative py-24">
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 1440 80" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" 
              fill="#FBF2E9"
              style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }}
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 pt-12">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="w-44 h-10 bg-gray-400/50 rounded mx-auto mb-4" />
            <div className="w-72 h-4 bg-gray-400/30 rounded mx-auto" />
          </div>

          {/* Email Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-6" />
              {/* Title */}
              <div className="w-24 h-6 bg-gray-300 rounded mx-auto mb-4" />
              {/* Email */}
              <div className="w-56 h-4 bg-gray-200 rounded mx-auto" />
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-12">
            <div className="w-52 h-14 bg-[#FBF2E9] rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SECTION 7: FOOTER
// ============================================
function FooterWireframe(): ReactElement {
  return (
    <footer className="bg-[#324158] py-8">
      <div className="container mx-auto px-4">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Column 1: Branding */}
          <div>
            <div className="w-32 h-5 bg-gray-400/50 rounded mb-3" />
            <div className="w-full h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-3/4 h-3 bg-gray-400/30 rounded" />
          </div>

          {/* Column 2: Contact */}
          <div>
            <div className="w-20 h-4 bg-gray-400/50 rounded mb-3" />
            <div className="w-32 h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-24 h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-44 h-3 bg-gray-400/30 rounded" />
          </div>

          {/* Column 3: Get Started */}
          <div>
            <div className="w-24 h-4 bg-gray-400/50 rounded mb-3" />
            <div className="w-28 h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-24 h-3 bg-gray-400/30 rounded" />
          </div>

          {/* Column 4: Resources */}
          <div>
            <div className="w-24 h-4 bg-gray-400/50 rounded mb-3" />
            <div className="w-28 h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-32 h-3 bg-gray-400/30 rounded mb-1" />
            <div className="w-28 h-3 bg-gray-400/30 rounded" />
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-4 mt-2 text-center">
          <div className="w-72 h-3 bg-gray-400/30 rounded mx-auto" />
        </div>
      </div>
    </footer>
  )
}

// ============================================
// HEADER/NAV WIREFRAME
// ============================================
function HeaderWireframe(): ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#324158] h-16">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-400/50 rounded" />
            <div className="w-28 h-5 bg-gray-400/50 rounded" />
          </div>

          {/* Nav Links (desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((link) => (
              <div key={link} className="w-20 h-4 bg-gray-400/30 rounded" />
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-28 h-10 bg-[#7A9E99] rounded-lg" />
            <div className="w-28 h-10 border-2 border-white/50 rounded-lg" />
          </div>

          {/* Mobile Menu Icon */}
          <div className="lg:hidden w-10 h-10 bg-gray-400/30 rounded" />
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN WIREFRAME COMPONENT
// ============================================
export default function HomepageWireframe(): ReactElement {
  return (
    <div className="min-h-screen bg-[#FBF2E9]">
      <HeaderWireframe />
      
      <main className="pt-0"> {/* No pt needed, Hero handles its own spacing */}
        <HeroWireframe />
        <WhatIsCareWireframe />
        <AboutWireframe />
        <WhatsHappeningWireframe />
        <ResourcesWireframe />
        <ContactWireframe />
      </main>
      
      <FooterWireframe />
    </div>
  )
}
