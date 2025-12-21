'use client'

import { ReactElement } from 'react'

/**
 * HomepageWireframeAnnotated - Annotated version of the wireframe
 * 
 * This version includes labels showing:
 * - Section names
 * - Background color values
 * - Shape types and positions
 * - Wave/divider variants
 * 
 * Use this for implementation reference.
 */

// Annotation Label Component
function Annotation({ 
  children, 
  position = 'top-left' 
}: { 
  children: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'center'
}): ReactElement {
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  return (
    <span 
      className={`absolute ${positionClasses[position]} bg-black/80 text-white text-xs px-2 py-1 rounded font-mono z-50 pointer-events-none`}
    >
      {children}
    </span>
  )
}

// Shape Label Component
function ShapeLabel({ 
  children,
  className = ''
}: { 
  children: string
  className?: string
}): ReactElement {
  return (
    <span 
      className={`absolute bg-red-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-mono z-50 pointer-events-none whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

// ============================================
// HERO SECTION WITH ANNOTATIONS
// ============================================
function HeroWireframeAnnotated(): ReactElement {
  return (
    <section className="relative min-h-[85vh] bg-[#FBF2E9] overflow-hidden">
      <Annotation>HERO - bg: #FBF2E9 (cream)</Annotation>
      
      {/* Background Blobs with annotations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large sage blob - top left */}
        <div className="relative">
          <div 
            className="absolute -top-[10%] -left-[10%] w-[55%] h-[70%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-[#7A9E99] opacity-20"
            style={{ transform: 'rotate(-10deg)' }}
          />
          <ShapeLabel className="top-20 left-20">
            SAGE BLOB: #7A9E99 @ 20% opacity, rotate(-10deg)
          </ShapeLabel>
        </div>
        
        {/* Dusty rose blob - bottom right */}
        <div className="relative">
          <div 
            className="absolute -bottom-[15%] -right-[10%] w-[40%] h-[50%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-[#D8A8A0] opacity-25"
            style={{ transform: 'rotate(15deg)' }}
          />
          <ShapeLabel className="bottom-40 right-20">
            DUSTY ROSE: #D8A8A0 @ 25% opacity, rotate(15deg)
          </ShapeLabel>
        </div>
        
        {/* Small tan accent - right side */}
        <div className="relative">
          <div 
            className="absolute top-[30%] right-[5%] w-[15%] h-[20%] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#C39778] opacity-20"
            style={{ transform: 'rotate(-5deg)' }}
          />
          <ShapeLabel className="top-[35%] right-[8%]">
            TAN ACCENT: #C39778 @ 20%
          </ShapeLabel>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 pt-24">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-400 mb-8 relative">
          <ShapeLabel className="-top-6 left-1/2 -translate-x-1/2">CARE Badge</ShapeLabel>
        </div>
        <div className="w-72 h-8 bg-gray-300 rounded mb-3" />
        <div className="w-56 h-8 bg-gray-300 rounded mb-6" />
        <div className="w-64 h-4 bg-gray-200 rounded mb-4" />
        <div className="w-96 max-w-full h-3 bg-gray-200 rounded mb-2" />
        <div className="w-80 max-w-full h-3 bg-gray-200 rounded mb-8" />
        <div className="w-44 h-12 bg-gray-300 rounded-full" />
      </div>
    </section>
  )
}

// ============================================
// WHAT IS CARE SECTION WITH ANNOTATIONS
// ============================================
function WhatIsCareWireframeAnnotated(): ReactElement {
  return (
    <section className="relative">
      {/* Section Title Area */}
      <div className="bg-[#FBF2E9] py-16 relative">
        <Annotation>SECTION TITLE - bg: #FBF2E9</Annotation>
        <div className="flex justify-center">
          <div className="w-80 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Cards Area */}
      <div className="bg-[#D8A8A0]/20 relative py-24">
        <Annotation>CARDS BG: #D8A8A0 @ 20% opacity</Annotation>
        
        {/* Top Wave Divider */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <ShapeLabel className="top-2 left-4">
            CURVE DIVIDER (top, flipped): variant=&quot;curve&quot;
          </ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,60 Q720,0 1440,60 L1440,80 L0,80 Z" fill="#FBF2E9" style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }} />
          </svg>
        </div>

        {/* Three Column Card Layout */}
        <div className="container mx-auto px-4 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg relative">
              <ShapeLabel className="-top-6 left-4">Card: How It Works</ShapeLabel>
              <div className="w-32 h-6 bg-gray-300 rounded mx-auto mb-8" />
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-300 rounded mb-2" />
                    <div className="w-full h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
              <div className="w-36 h-12 bg-gray-300 rounded-xl mx-auto mt-8" />
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg ring-2 ring-[#7A9E99]/30 relative">
              <ShapeLabel className="-top-6 left-4">Card: Why Join (featured)</ShapeLabel>
              <div className="w-24 h-6 bg-gray-300 rounded mx-auto mb-6" />
              <div className="w-full h-3 bg-gray-200 rounded mb-2" />
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-28 h-4 bg-gray-300 rounded mb-1" />
                    <div className="w-full h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
              <div className="w-40 h-12 bg-gray-300 rounded-xl mx-auto mt-8" />
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg relative">
              <ShapeLabel className="-top-6 left-4">Card: Kinds of Help</ShapeLabel>
              <div className="w-32 h-6 bg-gray-300 rounded mx-auto mb-6" />
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
          <ShapeLabel className="bottom-2 left-4">
            CURVE DIVIDER (bottom): variant=&quot;curve&quot;
          </ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,60 Q720,0 1440,60 L1440,80 L0,80 Z" fill="#FBF2E9" />
          </svg>
        </div>
      </div>
    </section>
  )
}

// ============================================
// ABOUT SECTION WITH ANNOTATIONS  
// ============================================
function AboutWireframeAnnotated(): ReactElement {
  return (
    <section className="relative">
      <div className="bg-[#FBF2E9] py-16 relative">
        <Annotation>SECTION TITLE - bg: #FBF2E9</Annotation>
        <div className="flex justify-center">
          <div className="w-72 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      <div className="bg-[#5A7E79] relative py-24">
        <Annotation>ABOUT BG: #5A7E79 (sage-dark)</Annotation>
        
        {/* Organic Top Divider */}
        <div className="absolute top-0 left-0 right-0 h-20">
          <ShapeLabel className="top-2 left-4">
            ORGANIC DIVIDER: variant=&quot;organic&quot; height=&quot;lg&quot;
          </ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,50 C180,70 360,20 540,45 C720,70 900,30 1080,55 C1260,80 1380,40 1440,50 L1440,80 L0,80 Z" fill="#FBF2E9" style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }} />
          </svg>
        </div>

        <div className="container mx-auto px-4 pt-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-5xl mx-auto">
            {/* Portrait */}
            <div className="flex-shrink-0 relative">
              <ShapeLabel className="-top-8 left-0">
                Portrait: ring=#D8A8A0 @ 50%
              </ShapeLabel>
              <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-full p-2 bg-[#D8A8A0]/50">
                <div className="w-full h-full rounded-full bg-gray-300" />
              </div>
              <div className="w-40 h-4 bg-gray-400/50 rounded mx-auto mt-6" />
            </div>

            {/* Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-white/20" />
                <div className="w-32 h-8 bg-gray-300/50 rounded" />
              </div>
              <div className="w-full h-4 bg-gray-300/50 rounded mb-3" />
              <div className="w-full h-4 bg-gray-300/50 rounded mb-3" />
              <div className="w-3/4 h-4 bg-gray-300/50 rounded mb-10" />
              <div className="w-80 max-w-full h-6 bg-gray-300/50 rounded mb-8" />
              <div className="w-48 h-12 bg-[#FBF2E9] rounded-xl mx-auto lg:mx-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// WHAT'S HAPPENING WITH ANNOTATIONS
// ============================================
function WhatsHappeningWireframeAnnotated(): ReactElement {
  return (
    <section className="relative">
      <div className="bg-[#FBF2E9] py-16 relative">
        <Annotation>SECTION TITLE</Annotation>
        <div className="flex justify-center">
          <div className="w-56 h-10 bg-gray-300 rounded" />
        </div>
      </div>

      <div className="bg-[#7A9E99]/15 relative py-24">
        <Annotation>CONTENT BG: #7A9E99 @ 15%</Annotation>
        
        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <ShapeLabel className="top-2 left-4">WAVE DIVIDER: variant=&quot;wave&quot;</ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#FBF2E9" style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }} />
          </svg>
        </div>

        <div className="container mx-auto px-4 pt-8">
          <div className="w-72 h-4 bg-gray-200 rounded mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-white rounded-2xl p-6 shadow-md relative">
                {card === 1 && <ShapeLabel className="-top-6 left-2">Event Cards</ShapeLabel>}
                <div className="w-full h-32 bg-gray-200 rounded-xl mb-4" />
                <div className="w-3/4 h-4 bg-gray-300 rounded mb-2" />
                <div className="w-full h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-56 h-14 bg-gray-300 rounded-xl" />
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12">
          <ShapeLabel className="bottom-2 left-4">WAVE DIVIDER</ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#FBF2E9" />
          </svg>
        </div>
      </div>
    </section>
  )
}

// ============================================
// RESOURCES WITH ANNOTATIONS
// ============================================
function ResourcesWireframeAnnotated(): ReactElement {
  return (
    <section className="bg-[#FBF2E9] py-20 relative">
      <Annotation>RESOURCES - bg: #FBF2E9 (no dividers)</Annotation>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-64 h-10 bg-gray-300 rounded mx-auto mb-6" />
          <div className="w-96 max-w-full h-4 bg-gray-200 rounded mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-12 relative">
          <ShapeLabel className="-top-8 left-0">6-Column Resource Grid</ShapeLabel>
          {[1, 2, 3, 4, 5, 6].map((card) => (
            <div key={card} className="bg-white rounded-2xl p-6 shadow-md text-center">
              <div className="w-14 h-14 bg-gray-200 rounded-xl mx-auto mb-4" />
              <div className="w-20 h-4 bg-gray-300 rounded mx-auto mb-2" />
              <div className="w-16 h-3 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="w-48 h-14 bg-gray-300 rounded-xl" />
        </div>
      </div>
    </section>
  )
}

// ============================================
// CONTACT WITH ANNOTATIONS
// ============================================
function ContactWireframeAnnotated(): ReactElement {
  return (
    <section className="relative">
      <div className="bg-[#324158] relative py-24">
        <Annotation>CONTACT BG: #324158 (navy)</Annotation>
        
        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 h-12">
          <ShapeLabel className="top-2 left-4">WAVE DIVIDER</ShapeLabel>
          <svg className="w-full h-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#FBF2E9" style={{ transform: 'scaleY(-1)', transformOrigin: 'center' }} />
          </svg>
        </div>

        <div className="container mx-auto px-4 pt-12">
          <div className="text-center mb-12">
            <div className="w-44 h-10 bg-gray-400/50 rounded mx-auto mb-4" />
            <div className="w-72 h-4 bg-gray-400/30 rounded mx-auto" />
          </div>

          <div className="max-w-md mx-auto relative">
            <ShapeLabel className="-top-8 left-0">Email Card (white)</ShapeLabel>
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-6" />
              <div className="w-24 h-6 bg-gray-300 rounded mx-auto mb-4" />
              <div className="w-56 h-4 bg-gray-200 rounded mx-auto" />
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <div className="w-52 h-14 bg-[#FBF2E9] rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FOOTER WITH ANNOTATIONS
// ============================================
function FooterWireframeAnnotated(): ReactElement {
  return (
    <footer className="bg-[#324158] py-8 relative">
      <Annotation>FOOTER - bg: #324158 (navy)</Annotation>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 relative">
          <ShapeLabel className="-top-8 left-0">4-Column Footer Grid</ShapeLabel>
          {['Branding', 'Contact', 'Get Started', 'Resources'].map((col, i) => (
            <div key={col}>
              <div className="w-24 h-4 bg-gray-400/50 rounded mb-3" />
              <div className="w-32 h-3 bg-gray-400/30 rounded mb-1" />
              <div className="w-28 h-3 bg-gray-400/30 rounded" />
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-4 mt-2 text-center">
          <div className="w-72 h-3 bg-gray-400/30 rounded mx-auto" />
        </div>
      </div>
    </footer>
  )
}

// ============================================
// HEADER WITH ANNOTATIONS
// ============================================
function HeaderWireframeAnnotated(): ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#324158] h-16">
      <Annotation position="top-right">HEADER - bg: #324158</Annotation>
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-400/50 rounded" />
            <div className="w-28 h-5 bg-gray-400/50 rounded" />
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((link) => (
              <div key={link} className="w-20 h-4 bg-gray-400/30 rounded" />
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-28 h-10 bg-[#7A9E99] rounded-lg" />
            <div className="w-28 h-10 border-2 border-white/50 rounded-lg" />
          </div>
          <div className="lg:hidden w-10 h-10 bg-gray-400/30 rounded" />
        </div>
      </div>
    </header>
  )
}

// ============================================
// MAIN ANNOTATED WIREFRAME
// ============================================
export default function HomepageWireframeAnnotated(): ReactElement {
  return (
    <div className="min-h-screen bg-[#FBF2E9]">
      <HeaderWireframeAnnotated />
      
      <main>
        <HeroWireframeAnnotated />
        <WhatIsCareWireframeAnnotated />
        <AboutWireframeAnnotated />
        <WhatsHappeningWireframeAnnotated />
        <ResourcesWireframeAnnotated />
        <ContactWireframeAnnotated />
      </main>
      
      <FooterWireframeAnnotated />
    </div>
  )
}
