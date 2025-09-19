'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AnalyticsTrackerProps {
  listingId?: string
}

export function AnalyticsTracker({ listingId }: AnalyticsTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('Analytics tracking failed:', error)
      }
    }

    trackPageView()
  }, [pathname])

  useEffect(() => {
    // Track listing view if listingId is provided
    if (listingId) {
      const trackListingView = async () => {
        try {
          await fetch('/api/analytics/listing-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              listingId,
              timestamp: new Date().toISOString()
            })
          })
        } catch (error) {
          // Silently fail - analytics shouldn't break the app
          console.debug('Listing analytics tracking failed:', error)
        }
      }

      trackListingView()
    }
  }, [listingId])

  return null // This component doesn't render anything
}
