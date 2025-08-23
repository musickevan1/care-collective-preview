import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { overlock, fontClasses, atkinsonHyperlegible } from "@/lib/fonts";
// Service worker and web vitals components removed to prevent build issues
// import { DynamicServiceWorkerRegistration, DynamicWebVitals } from "@/components/DynamicComponents";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: "CARE Collective - Preview",
  description: "Southwest Missouri CARE Collective - Building community through mutual aid (Preview Version)",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "CARE Collective - Preview",
    description: "Southwest Missouri CARE Collective - Building community through mutual aid",
    images: ['/logo.png'],
    type: 'website',
  },
  robots: {
    index: false, // Preview version shouldn't be indexed
    follow: false,
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
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontClasses.primary} ${fontClasses.accessible}`}>
      <head>
        {/* Critical font preload */}
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`antialiased ${overlock.className} font-feature-settings-'kern' 1`}>
        <Providers>
          {/* Temporarily disabled to fix deployment issue */}
          {false && process.env.NODE_ENV === 'production' && (
            <>
              <DynamicServiceWorkerRegistration />
              <DynamicWebVitals />
            </>
          )}
          {children}
          <footer className="bg-secondary text-secondary-foreground py-4 mt-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm opacity-75">
                🚀 Preview Version - Built for Client Review
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}