// Import polyfills first to fix server-side 'self is not defined' errors
import "@/lib/global-polyfills.js";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { overlock, fontClasses, atkinsonHyperlegible, playfairDisplay } from "@/lib/fonts";
import { DynamicServiceWorkerRegistration, DynamicWebVitals } from "@/components/DynamicComponents";

// LAUNCH: Disabled beta testing - removed "Preview" references and enabled SEO
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: "CARE Collective",
  description: "Southwest Missouri CARE Collective - Building community through mutual support",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "CARE Collective",
    description: "Southwest Missouri CARE Collective - Building community through mutual support",
    images: ['/logo.png'],
    type: 'website',
  },
  robots: {
    index: true, // Enable SEO for production launch
    follow: true,
  },
  other: {
    // Critical resource hints for performance
    'dns-prefetch': 'https://fonts.googleapis.com',
    'preconnect': 'https://fonts.gstatic.com',
    'preload': JSON.stringify([
      { href: '/logo.png', as: 'image', type: 'image/png' },
    ])
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // Enable safe area insets for iOS notch/home indicator
  // Remove maximumScale to allow zooming for accessibility (WCAG 2.1 AA requirement)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontClasses.primary} ${fontClasses.accessible} ${fontClasses.display}`}>
      <head>
        {/* Critical font preload */}
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`antialiased ${overlock.className} font-feature-settings-'kern' 1`}>
        <Providers>
          {children}
        </Providers>

        {/* Service Worker and Performance Monitoring */}
        <DynamicServiceWorkerRegistration />
        <DynamicWebVitals />
      </body>
    </html>
  );
}