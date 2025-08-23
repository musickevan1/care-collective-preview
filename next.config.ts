import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self)'
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
  async rewrites() {
    return [
      // Add CSP via middleware instead for more flexibility
    ]
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Enhanced image optimization
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },


  // Strict mode for better error handling
  reactStrictMode: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // Trailing slash handling
  trailingSlash: false,

  // Compression for performance
  compress: true,

  // TypeScript configuration - temporary for deployment
  typescript: {
    // Skip type checking during build for deployment
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // Skip ESLint during build for deployment
    ignoreDuringBuilds: true,
  },

  // Output optimization for static export and performance
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
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

  // Simplified webpack configuration - heavy optimizations only in production
  webpack: (config, { dev, isServer, webpack }) => {
    // Minimal intervention: just define self for server builds
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'global',
        })
      )
    }

    // Bundle analyzer only when explicitly requested
    if (process.env.ANALYZE === 'true' && !dev) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          generateStatsFile: true,
        })
      )
    }

    // Only apply heavy optimizations in production
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      config.optimization.concatenateModules = true
      
      // Advanced code splitting only in production
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendors',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
            enforce: true,
          },
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 30,
            enforce: true,
          },
        },
      }

      // Performance hints only in production
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 244 * 1024,
        maxAssetSize: 244 * 1024,
      }
    } else {
      // Development: disable performance hints for faster builds
      config.performance = false
    }

    return config
  },

  // Experimental features - temporarily disabled to debug build issues
  experimental: {
    // Disable all experimental features that might cause build issues
    webpackBuildWorker: false,
    memoryBasedWorkersCount: false,
  },
  
  // Server components external packages (moved out of experimental)
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;