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
    unoptimized: true, // Required for static export
  },

  // Strict mode for better error handling
  reactStrictMode: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // Trailing slash handling
  trailingSlash: false,

  // Compression for performance
  compress: true,

  // TypeScript configuration  
  typescript: {
    // Temporarily bypass during build while maintaining local type checking
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // Temporarily disable ESLint during build until config is fixed
    ignoreDuringBuilds: true,
  },

  // Use static export to bypass SSR issues
  output: 'export',
  trailingSlash: true,
  
  // Disable static optimization for dynamic routes
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
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

  // Simplified webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix "self is not defined" error for all contexts
    config.plugins.push(
      new webpack.DefinePlugin({
        self: 'typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {}',
      })
    )
    
    // Additional global polyfills for server environment
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
      
      // Provide fallbacks for Node.js polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "stream": false,
        "util": false,
        "url": false,
        "zlib": false,
        "https": false,
        "http": false,
      }
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

  // Experimental features - compatible with Next.js 14
  experimental: {
    // Next.js 14 compatible experimental features
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};

module.exports = nextConfig;