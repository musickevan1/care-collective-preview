'use client'

import { useEffect, useState, memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetrics {
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null
  ttfb: number | null
  // Navigation timing
  domContentLoaded: number | null
  loadComplete: number | null
  firstByte: number | null
  domInteractive: number | null
  // Bundle metrics
  bundleSize: number | null
  // Memory usage
  jsHeapSizeUsed: number | null
  jsHeapSizeTotal: number | null
}

interface PerformanceMonitorProps {
  showDetails?: boolean
  className?: string
}

// Thresholds for performance scoring (based on Core Web Vitals)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
} as const

// Performance grade calculator
function getPerformanceGrade(metric: number | null, thresholds: { good: number, poor: number }): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (metric === null) return 'unknown'
  if (metric <= thresholds.good) return 'good'
  if (metric <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

// Color mapping for grades
const GRADE_COLORS = {
  good: 'bg-green-100 text-green-800 border-green-200',
  'needs-improvement': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  poor: 'bg-red-100 text-red-800 border-red-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200'
} as const

export const PerformanceMonitor = memo<PerformanceMonitorProps>(({ 
  showDetails = false, 
  className = '' 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    firstByte: null,
    domInteractive: null,
    bundleSize: null,
    jsHeapSizeUsed: null,
    jsHeapSizeTotal: null
  })

  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check for browser support
    if (typeof window === 'undefined' || !('performance' in window)) {
      return
    }

    setIsSupported(true)

    // Get navigation timing metrics immediately
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const navigation = navigationEntries[0] as PerformanceNavigationTiming
      // Use fetchStart as baseline since navigationStart is deprecated
      const baseTime = navigation.fetchStart
      setMetrics(prev => ({
        ...prev,
        domContentLoaded: navigation.domContentLoadedEventEnd - baseTime,
        loadComplete: navigation.loadEventEnd - baseTime,
        firstByte: navigation.responseStart - baseTime,
        domInteractive: navigation.domInteractive - baseTime,
        ttfb: navigation.responseStart - navigation.requestStart
      }))
    }

    // Get memory information if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        jsHeapSizeUsed: memoryInfo.usedJSHeapSize,
        jsHeapSizeTotal: memoryInfo.totalJSHeapSize
      }))
    }

    // Load web vitals and measure Core Web Vitals (browser-only)
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Dynamic import with proper error handling for browser environments
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        // Only initialize if we're in a browser with proper performance API support
        if ('PerformanceObserver' in window) {
          onCLS((metric) => {
            setMetrics(prev => ({ ...prev, cls: metric.value }))
          })

          onFID((metric) => {
            setMetrics(prev => ({ ...prev, fid: metric.value }))
          })

          onFCP((metric) => {
            setMetrics(prev => ({ ...prev, fcp: metric.value }))
          })

          onLCP((metric) => {
            setMetrics(prev => ({ ...prev, lcp: metric.value }))
          })

          onTTFB((metric) => {
            setMetrics(prev => ({ ...prev, ttfb: metric.value }))
          })
        }
      }).catch(error => {
        console.warn('Failed to load web-vitals (likely SSR environment):', error)
      })
    }

    // Estimate bundle size (approximation)
    const scriptElements = document.querySelectorAll('script[src]')
    let estimatedBundleSize = 0
    
    Array.from(scriptElements).forEach(script => {
      // This is a rough estimation - in production you'd use Resource Timing API
      const scriptElement = script as HTMLScriptElement
      if (scriptElement.src && scriptElement.src.includes('_next/static/')) {
        estimatedBundleSize += 50000 // Approximate average chunk size
      }
    })

    if (estimatedBundleSize > 0) {
      setMetrics(prev => ({ ...prev, bundleSize: estimatedBundleSize }))
    }

  }, [])

  // Memoize performance scores
  const performanceScores = useMemo(() => ({
    lcp: getPerformanceGrade(metrics.lcp, THRESHOLDS.LCP),
    fid: getPerformanceGrade(metrics.fid, THRESHOLDS.FID),
    cls: getPerformanceGrade(metrics.cls, THRESHOLDS.CLS),
    fcp: getPerformanceGrade(metrics.fcp, THRESHOLDS.FCP),
    ttfb: getPerformanceGrade(metrics.ttfb, THRESHOLDS.TTFB)
  }), [metrics])

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    const scores = Object.values(performanceScores).filter(score => score !== 'unknown')
    if (scores.length === 0) return 'unknown'
    
    const goodCount = scores.filter(score => score === 'good').length
    const poorCount = scores.filter(score => score === 'poor').length
    
    if (goodCount >= scores.length * 0.8) return 'good'
    if (poorCount >= scores.length * 0.5) return 'poor'
    return 'needs-improvement'
  }, [performanceScores])

  // Format milliseconds for display
  const formatMs = (value: number | null) => {
    if (value === null) return 'Measuring...'
    return `${Math.round(value)}ms`
  }

  // Format bytes for display
  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return 'Unknown'
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Performance monitoring not supported in this environment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Overall Score */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Performance Score</CardTitle>
            <Badge className={`${GRADE_COLORS[overallScore]} border`}>
              {overallScore.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Core Web Vitals */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm font-medium">LCP</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatMs(metrics.lcp)}</span>
                <Badge className={`${GRADE_COLORS[performanceScores.lcp]} border text-xs`}>
                  {performanceScores.lcp === 'unknown' ? '?' : performanceScores.lcp === 'good' ? '✓' : performanceScores.lcp === 'poor' ? '✗' : '!'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm font-medium">FID</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatMs(metrics.fid)}</span>
                <Badge className={`${GRADE_COLORS[performanceScores.fid]} border text-xs`}>
                  {performanceScores.fid === 'unknown' ? '?' : performanceScores.fid === 'good' ? '✓' : performanceScores.fid === 'poor' ? '✗' : '!'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-sm font-medium">CLS</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{metrics.cls ? metrics.cls.toFixed(3) : 'Measuring...'}</span>
                <Badge className={`${GRADE_COLORS[performanceScores.cls]} border text-xs`}>
                  {performanceScores.cls === 'unknown' ? '?' : performanceScores.cls === 'good' ? '✓' : performanceScores.cls === 'poor' ? '✗' : '!'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Loading Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>First Contentful Paint</span>
                <span>{formatMs(metrics.fcp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time to First Byte</span>
                <span>{formatMs(metrics.ttfb)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DOM Interactive</span>
                <span>{formatMs(metrics.domInteractive)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DOM Content Loaded</span>
                <span>{formatMs(metrics.domContentLoaded)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Load Complete</span>
                <span>{formatMs(metrics.loadComplete)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimated Bundle Size</span>
                <span>{formatBytes(metrics.bundleSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>JS Heap Used</span>
                <span>{formatBytes(metrics.jsHeapSizeUsed)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>JS Heap Total</span>
                <span>{formatBytes(metrics.jsHeapSizeTotal)}</span>
              </div>
              {metrics.jsHeapSizeUsed && metrics.jsHeapSizeTotal && (
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span>{Math.round((metrics.jsHeapSizeUsed / metrics.jsHeapSizeTotal) * 100)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tips */}
      {overallScore !== 'good' && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-800">Performance Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-amber-700 space-y-1">
              {performanceScores.lcp !== 'good' && (
                <li>• Optimize images and critical resource loading for better LCP</li>
              )}
              {performanceScores.fid !== 'good' && (
                <li>• Reduce JavaScript execution time for better interactivity</li>
              )}
              {performanceScores.cls !== 'good' && (
                <li>• Ensure proper sizing for images and elements to reduce layout shift</li>
              )}
              {performanceScores.ttfb !== 'good' && (
                <li>• Optimize server response time and use CDN for better TTFB</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

// Export performance monitoring hook for use in other components
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domContentLoaded: null,
    loadComplete: null,
    firstByte: null,
    domInteractive: null,
    bundleSize: null,
    jsHeapSizeUsed: null,
    jsHeapSizeTotal: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Get navigation timing immediately
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const navigation = navigationEntries[0] as PerformanceNavigationTiming
      // Use fetchStart as baseline since navigationStart is deprecated
      const baseTime = navigation.fetchStart
      setMetrics(prev => ({
        ...prev,
        domContentLoaded: navigation.domContentLoadedEventEnd - baseTime,
        loadComplete: navigation.loadEventEnd - baseTime,
        firstByte: navigation.responseStart - baseTime,
        domInteractive: navigation.domInteractive - baseTime
      }))
    }

    // Load and track web vitals (browser-only)
    if (typeof window !== 'undefined' && 'performance' in window && 'PerformanceObserver' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS((metric) => setMetrics(prev => ({ ...prev, cls: metric.value })))
        onFID((metric) => setMetrics(prev => ({ ...prev, fid: metric.value })))
        onFCP((metric) => setMetrics(prev => ({ ...prev, fcp: metric.value })))
        onLCP((metric) => setMetrics(prev => ({ ...prev, lcp: metric.value })))
        onTTFB((metric) => setMetrics(prev => ({ ...prev, ttfb: metric.value })))
      }).catch(error => {
        console.warn('Failed to load web-vitals in usePerformanceMetrics:', error)
      })
    }
  }, [])

  return metrics
}