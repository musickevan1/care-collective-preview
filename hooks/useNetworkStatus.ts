/**
 * @fileoverview Network status hook for mobile-optimized messaging
 * Provides connection status, bandwidth detection, and retry logic
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: 'wifi' | 'cellular' | '2g' | '3g' | '4g' | '5g' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  rtt: number // Round trip time in ms
  downlink: number // Bandwidth estimate in Mbps
  saveData: boolean // User has requested reduced data usage
}

interface UseNetworkStatusOptions {
  enablePing?: boolean
  pingInterval?: number
  pingUrl?: string
  onConnectionChange?: (isOnline: boolean) => void
}

interface UseNetworkStatusReturn {
  networkStatus: NetworkStatus
  retry: () => Promise<void>
  isRetrying: boolean
  lastChecked: Date | null
}

/**
 * Hook for monitoring network status with mobile-specific optimizations
 * Features: Connection type detection, bandwidth estimation, retry logic
 */
export function useNetworkStatus({
  enablePing = true,
  pingInterval = 30000, // 30 seconds
  pingUrl = '/api/health',
  onConnectionChange
}: UseNetworkStatusOptions = {}): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    rtt: 0,
    downlink: 0,
    saveData: false
  })

  const [isRetrying, setIsRetrying] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const pingTimeoutRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Get connection info from Network Information API
  const getConnectionInfo = useCallback((): Partial<NetworkStatus> => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    if (!connection) {
      return {
        connectionType: 'unknown',
        effectiveType: 'unknown',
        rtt: 0,
        downlink: 0,
        saveData: false
      }
    }

    // Determine connection type
    let connectionType: NetworkStatus['connectionType'] = 'unknown'
    if (connection.type) {
      connectionType = connection.type
    } else if (connection.effectiveType) {
      // Map effective type to general type
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          connectionType = '2g'
          break
        case '3g':
          connectionType = '3g'
          break
        case '4g':
          connectionType = '4g'
          break
        default:
          connectionType = 'unknown'
      }
    }

    return {
      connectionType,
      effectiveType: connection.effectiveType || 'unknown',
      rtt: connection.rtt || 0,
      downlink: connection.downlink || 0,
      saveData: connection.saveData || false,
      isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
    }
  }, [])

  // Ping server to verify actual connectivity
  const pingServer = useCallback(async (): Promise<boolean> => {
    if (!enablePing) return navigator.onLine

    try {
      const startTime = performance.now()
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      const endTime = performance.now()
      const rtt = endTime - startTime

      // Update RTT if we got a response
      if (response.ok) {
        setNetworkStatus(prev => ({ ...prev, rtt }))
        return true
      }

      return false
    } catch (error) {
      console.warn('Network ping failed:', error)
      return false
    }
  }, [enablePing, pingUrl])

  // Update network status
  const updateNetworkStatus = useCallback(async () => {
    const isOnline = navigator.onLine
    const connectionInfo = getConnectionInfo()

    // Verify with server ping if online
    const serverReachable = isOnline ? await pingServer() : false

    const newStatus: NetworkStatus = {
      isOnline: isOnline && serverReachable,
      ...connectionInfo,
      isSlowConnection: connectionInfo.isSlowConnection || false
    }

    setNetworkStatus(prev => {
      // Call change handler if online status changed
      if (prev.isOnline !== newStatus.isOnline && onConnectionChange) {
        onConnectionChange(newStatus.isOnline)
      }
      return newStatus
    })

    setLastChecked(new Date())
    retryCountRef.current = 0 // Reset retry count on successful check
  }, [getConnectionInfo, pingServer, onConnectionChange])

  // Manual retry function
  const retry = useCallback(async () => {
    if (isRetrying || retryCountRef.current >= maxRetries) return

    setIsRetrying(true)
    retryCountRef.current += 1

    try {
      // Wait a bit before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))

      await updateNetworkStatus()
    } finally {
      setIsRetrying(false)
    }
  }, [isRetrying, updateNetworkStatus])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus()
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }))
      setLastChecked(new Date())
    }

    // Handle connection change (mobile-specific)
    const handleConnectionChange = () => {
      updateNetworkStatus()
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes (mobile)
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Initial status check
    updateNetworkStatus()

    // Set up periodic pings
    if (enablePing) {
      const setupPingInterval = () => {
        pingTimeoutRef.current = setTimeout(() => {
          updateNetworkStatus()
          setupPingInterval()
        }, pingInterval)
      }
      setupPingInterval()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }

      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current)
      }
    }
  }, [updateNetworkStatus, enablePing, pingInterval])

  // Handle page visibility changes (pause pings when hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear ping interval when page is hidden
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current)
        }
      } else {
        // Resume pings when page becomes visible
        updateNetworkStatus()

        if (enablePing) {
          pingTimeoutRef.current = setTimeout(() => {
            updateNetworkStatus()
          }, pingInterval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateNetworkStatus, enablePing, pingInterval])

  return {
    networkStatus,
    retry,
    isRetrying,
    lastChecked
  }
}

/**
 * Hook for adaptive behavior based on connection quality
 */
interface UseAdaptiveLoadingOptions {
  lowBandwidthThreshold?: number // Mbps
  highLatencyThreshold?: number // ms
}

interface UseAdaptiveLoadingReturn {
  shouldReduceQuality: boolean
  shouldDisableRealtime: boolean
  shouldBatchRequests: boolean
  recommendedPageSize: number
}

export function useAdaptiveLoading({
  lowBandwidthThreshold = 1.0, // 1 Mbps
  highLatencyThreshold = 1000 // 1 second
}: UseAdaptiveLoadingOptions = {}): UseAdaptiveLoadingReturn {
  const { networkStatus } = useNetworkStatus()

  const shouldReduceQuality = networkStatus.isSlowConnection ||
                             networkStatus.downlink < lowBandwidthThreshold ||
                             networkStatus.saveData

  const shouldDisableRealtime = networkStatus.effectiveType === 'slow-2g' ||
                               networkStatus.rtt > highLatencyThreshold

  const shouldBatchRequests = networkStatus.isSlowConnection ||
                             networkStatus.saveData

  const recommendedPageSize = networkStatus.isSlowConnection ? 10 :
                             networkStatus.effectiveType === '3g' ? 20 : 50

  return {
    shouldReduceQuality,
    shouldDisableRealtime,
    shouldBatchRequests,
    recommendedPageSize
  }
}