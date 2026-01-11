const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), fullscreen=(self)'
          }
        ],
      },
      {
        // Static assets caching for performance
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        // Logo caching
        source: '/logo.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        // HTML pages - no cache for immediate updates on deployment
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=0, must-revalidate'
          }
        ],
      },
      {
        // Additional security for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      },
      {
        // Security for admin routes
        source: '/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive'
          }
        ],
      }
    ]
  },

  // Content Security Policy
  // NOTE: CSP is implemented in lib/security/middleware.ts via addSecurityHeaders()
  // and applied through lib/supabase/middleware.ts. This provides more flexibility
  // for environment-specific policies (e.g., allowing vercel.live only in development).
  async rewrites() {
    return []
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization - enabled for SSR deployment on Vercel
  // All images are local (/public/), no remote patterns needed
  images: {
    // Vercel handles image optimization automatically for SSR apps
    // Removed unoptimized: true (was incorrectly set for static export)
    formats: ['image/avif', 'image/webp'],
  },

  // Strict mode for better error handling
  reactStrictMode: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,


  // Compression for performance
  compress: true,

  // TypeScript configuration
  typescript: {
    // Strict type checking enabled for production safety
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Temporarily disable ESLint during builds due to Next.js 14.2.32 compatibility issue
    // with deprecated ESLint options (useEslintrc, extensions)
    // Type checking is still enforced via typescript.ignoreBuildErrors: false
    ignoreDuringBuilds: true,
  },

  // Build configuration for Vercel deployment
  output: undefined, // Allow SSR
  trailingSlash: false,
  
  // Advanced compiler options for better performance
  compiler: {
    // Remove console.log statements in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // React compiler optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$']
    } : false,
  },

  // Enhanced webpack config for bundle optimization
  webpack: (config, { buildId, dev, isServer }) => {
    // Enable bundle analyzer in development when ANALYZE=true
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true,
        })
      )
    }

    // Optimize bundle splitting for Care Collective specific routes
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Admin dashboard components
          admin: {
            test: /[\\/]components[\\/]admin[\\/]/,
            name: 'admin-components',
            chunks: 'all',
            priority: 20,
          },
          // Messaging components
          messaging: {
            test: /[\\/]components[\\/]messaging[\\/]/,
            name: 'messaging-components',
            chunks: 'all',
            priority: 20,
          },
          // UI components
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            priority: 15,
          },
          // Supabase client - only split for client bundles (not server/edge)
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'async', // Changed from 'all' to 'async' to avoid Edge Runtime issues
            priority: 10,
          },
          // Large vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react-vendor',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    }

    // Tree shaking is handled automatically by Next.js
    // Manual usedExports/sideEffects settings conflict with cacheUnaffected

    return config
  },

  // Experimental features - compatible with Next.js 14
  experimental: {
    // Next.js 14 compatible experimental features
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry configuration options
  org: "evan-musick",
  project: "care-collective",

  // Suppress source map upload logs during build
  silent: !process.env.CI,

  // Upload source maps for better error debugging
  widenClientFileUpload: true,

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Webpack-specific options (new API)
  webpack: {
    // Disable automatic instrumentation (we configure manually)
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: true,
    // Tree-shake Sentry logger statements
    treeshake: {
      removeDebugLogging: true,
    },
  },
});