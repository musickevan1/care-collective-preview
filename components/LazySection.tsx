'use client'

import { ReactNode, useEffect, useRef, useState, memo, useCallback } from 'react'

interface LazySectionProps {
  children: ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: ReactNode
  className?: string
  priority?: boolean
  triggerOnce?: boolean
}

/**
 * LazySection - Optimized lazy loading with advanced intersection observer
 * Supports priority loading and one-time triggers for better performance
 */
export const LazySection = memo<LazySectionProps>(({ 
  children, 
  threshold = 0.1, 
  rootMargin = '50px',
  fallback = null,
  className = '',
  priority = false,
  triggerOnce = true
}) => {
  const [isVisible, setIsVisible] = useState(priority) // Priority sections load immediately
  const [hasLoaded, setHasLoaded] = useState(priority)
  const ref = useRef<HTMLDivElement>(null)

  // Memoized intersection observer callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && !hasLoaded) {
      setIsVisible(true)
      setHasLoaded(true)
    } else if (!triggerOnce && !entry.isIntersecting && hasLoaded) {
      // For non-trigger-once sections, allow hiding when out of view
      setIsVisible(false)
    }
  }, [hasLoaded, triggerOnce])

  useEffect(() => {
    if (priority) return // Skip observer for priority sections

    // Use a single observer with optimized options
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      // Optimize performance by reducing observer frequency
      trackVisibility: true,
      delay: 100
    })

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [threshold, rootMargin, handleIntersection, priority])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  )
})

LazySection.displayName = 'LazySection'

/**
 * Advanced Lazy Loading Hook for custom implementations
 */
export function useLazyLoading(options: {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
} = {}) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting && !hasLoaded) {
      setIsVisible(true)
      setHasLoaded(true)
    } else if (!triggerOnce && !entry.isIntersecting && hasLoaded) {
      setIsVisible(false)
    }
  }, [hasLoaded, triggerOnce])

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      trackVisibility: true,
      delay: 100
    })

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [threshold, rootMargin, handleIntersection])

  return { ref, isVisible, hasLoaded }
}

/**
 * Lazy Loading Manager - Global lazy loading optimization
 */
class LazyLoadingManager {
  private static instance: LazyLoadingManager
  private observers = new Map<string, IntersectionObserver>()
  private loadingQueue: Array<() => void> = []
  private isProcessing = false

  static getInstance() {
    if (!LazyLoadingManager.instance) {
      LazyLoadingManager.instance = new LazyLoadingManager()
    }
    return LazyLoadingManager.instance
  }

  // Batch multiple lazy loading operations
  addToQueue(loadFn: () => void) {
    this.loadingQueue.push(loadFn)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing || this.loadingQueue.length === 0) return
    
    this.isProcessing = true
    
    // Process items in batches to avoid overwhelming the browser
    const batchSize = 3
    while (this.loadingQueue.length > 0) {
      const batch = this.loadingQueue.splice(0, batchSize)
      await Promise.all(batch.map(fn => fn()))
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 16)) // ~1 frame
    }
    
    this.isProcessing = false
  }

  // Create shared observer for similar elements
  getSharedObserver(key: string, options: IntersectionObserverInit) {
    if (!this.observers.has(key)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const element = entry.target as HTMLElement
          const callback = element.dataset.lazyCallback
          if (callback && entry.isIntersecting) {
            // Execute stored callback
            const fn = new Function('return ' + callback)()
            fn()
          }
        })
      }, options)
      
      this.observers.set(key, observer)
    }
    return this.observers.get(key)!
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.loadingQueue = []
  }
}

export const lazyLoadingManager = LazyLoadingManager.getInstance()

/**
 * LazyImage - Optimized lazy loading using Next.js Image
 * This should be used instead of regular img tags for better optimization
 */
import Image from 'next/image'

interface LazyImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
}

export function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) {
      // Skip intersection observer for priority images
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  return (
    <div ref={imgRef} className={className}>
      {(isInView || priority) && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          quality={quality}
          className="transition-opacity duration-300"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyEiWZQeGJ3Hcz3k0y7FhI0bNK0Y8A+vUYKhgHxJOeHjdGVcMKG8ccGaZu4oj/nB+kQjGfT/9k="
        />
      )}
    </div>
  )
}