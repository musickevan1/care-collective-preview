'use client'

import Image from 'next/image'
import { ReactElement, useState, useEffect, useCallback } from 'react'
import AnimatedGradientText from './AnimatedGradientText'
import MouseGradientBackground from './MouseGradientBackground'
import MagneticButton from './MagneticButton'

/**
 * Hero carousel images configuration
 * Uses optimized WebP images with responsive srcset
 */
const HERO_IMAGES = [
  { id: 1, alt: 'Caring hands supporting community members' },
  { id: 2, alt: 'Neighbors helping each other with daily tasks' },
  { id: 3, alt: 'Community volunteers sharing resources' },
  { id: 4, alt: 'Caregivers connecting and supporting one another' },
  { id: 5, alt: 'Southwest Missouri community members united in care' },
] as const;

const CROSSFADE_INTERVAL = 4000; // 4 seconds between images
const CROSSFADE_DURATION = 1000; // 1 second transition
const FLIP_DELAY = 800; // Delay before coin flip starts (let page load)
const FLIP_DURATION = 1800; // Duration of coin flip animation

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
 * Circular hero image carousel with coin-flip intro animation
 * Features:
 * - 3D coin flip animation on page load (logo → photos)
 * - Optimized WebP images with responsive srcset
 * - 4-second intervals, 1-second crossfade transitions
 */
function HeroImageCarousel(): ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [carouselStarted, setCarouselStarted] = useState(false);

  // Preload next image
  const preloadImage = useCallback((index: number) => {
    const img = new window.Image();
    img.src = `/hero-images/optimized/hero-${HERO_IMAGES[index].id}-800w.webp`;
  }, []);

  // Initialize: preload first two images
  useEffect(() => {
    preloadImage(0);
    preloadImage(1);
  }, [preloadImage]);

  // Trigger coin flip after initial delay
  useEffect(() => {
    const flipTimer = setTimeout(() => {
      setHasFlipped(true);
    }, FLIP_DELAY);
    return () => clearTimeout(flipTimer);
  }, []);

  // Start carousel after flip animation completes
  useEffect(() => {
    if (!hasFlipped) return;
    
    const startTimer = setTimeout(() => {
      setCarouselStarted(true);
    }, FLIP_DURATION);
    
    return () => clearTimeout(startTimer);
  }, [hasFlipped]);

  // Auto-advance carousel (only after flip completes)
  useEffect(() => {
    if (!carouselStarted) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % HERO_IMAGES.length;
        // Preload the image after the next one
        const preloadIndex = (nextIndex + 1) % HERO_IMAGES.length;
        preloadImage(preloadIndex);
        return nextIndex;
      });
    }, CROSSFADE_INTERVAL);

    return () => clearInterval(interval);
  }, [carouselStarted, preloadImage]);

  // Generate srcset for responsive images
  const getSrcSet = (id: number) => 
    `/hero-images/optimized/hero-${id}-400w.webp 400w, ` +
    `/hero-images/optimized/hero-${id}-800w.webp 800w, ` +
    `/hero-images/optimized/hero-${id}-1200w.webp 1200w`;

  // Sizes attribute for responsive loading
  const sizes = '(max-width: 640px) 220px, (max-width: 768px) 260px, (max-width: 1024px) 300px, (max-width: 1280px) 400px, (max-width: 1536px) 450px, 500px';

  return (
    <div className="relative flex-shrink-0">
      {/* 3D Coin flip container */}
      <div 
        className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[500px] 2xl:h-[500px]"
        style={{ perspective: '1000px' }}
      >
        {/* Coin inner - this rotates (including border and shadow) */}
        <div 
          className="relative w-full h-full transition-transform duration-[1800ms]"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: hasFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Front face - Logo with border and shadow */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full p-2.5 sm:p-3 md:p-3.5 lg:p-4 xl:p-5 bg-gradient-to-br from-dusty-rose/70 via-dusty-rose/50 to-dusty-rose/30"
            style={{ 
              backfaceVisibility: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-cream shadow-inner flex items-center justify-center">
              <img
                src="/logo-textless.png"
                alt="CARE Collective Logo"
                className="w-[75%] h-[75%] object-contain"
                loading="eager"
              />
            </div>
          </div>
          
          {/* Back face - Carousel images with border and shadow */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full p-2.5 sm:p-3 md:p-3.5 lg:p-4 xl:p-5 bg-gradient-to-br from-dusty-rose/70 via-dusty-rose/50 to-dusty-rose/30"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-cream shadow-inner">
              {HERO_IMAGES.map((image, index) => (
                <img
                  key={image.id}
                  src={`/hero-images/optimized/hero-${image.id}-800w.webp`}
                  srcSet={getSrcSet(image.id)}
                  sizes={sizes}
                  alt={image.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transitionDuration: `${CROSSFADE_DURATION}ms` }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative accent circle - scaled up proportionally */}
      <div 
        className="absolute -bottom-4 -left-4 w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-sage/20 -z-10"
        aria-hidden="true"
      />
      
      {/* Visually hidden status for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {hasFlipped 
          ? `Image ${currentIndex + 1} of ${HERO_IMAGES.length}: ${HERO_IMAGES[currentIndex].alt}`
          : 'CARE Collective Logo'
        }
      </div>
    </div>
  );
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
              <HeroImageCarousel />
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
