import { Inter, Overlock, Atkinson_Hyperlegible, Playfair_Display } from 'next/font/google'

// Primary brand font - Overlock with optimized loading
export const overlock = Overlock({
  subsets: ['latin'],
  variable: '--font-overlock',
  display: 'swap', // Prevent invisible text during font swap
  weight: ['400', '700', '900'],
  preload: true, // Preload primary font
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true, // Reduce layout shift
})

// Display font for hero headlines - Playfair Display (elegant serif)
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  preload: true, // Preload for hero section
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: true,
})

// Accessible font - Atkinson Hyperlegible with optimized loading
export const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ['latin'],
  variable: '--font-atkinson',
  display: 'swap',
  weight: ['400', '700'],
  preload: false, // Load when accessibility mode is enabled
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
})

// System font fallback for Inter (lighter bundle)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false, // Only load when needed for specific components
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
})

/**
 * Preload critical fonts for better LCP
 * Call this in the document head
 */
export function getCriticalFontPreloads() {
  return [
    {
      rel: 'preload',
      href: '/_next/static/media/overlock-400.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    },
    {
      rel: 'preload', 
      href: '/_next/static/media/overlock-700.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    }
  ]
}

// Font class utilities for easy application
export const fontClasses = {
  primary: overlock.variable,
  accessible: atkinsonHyperlegible.variable,
  system: inter.variable,
  display: playfairDisplay.variable
}

// CSS variable mapping
export const fontVariables = {
  '--font-family-sans': 'var(--font-overlock), system-ui, -apple-system, sans-serif',
  '--font-family-accessible': 'var(--font-atkinson), system-ui, -apple-system, sans-serif', 
  '--font-family-system': 'var(--font-inter), system-ui, -apple-system, sans-serif',
  '--font-family-display': 'var(--font-playfair), Georgia, Times New Roman, serif'
}