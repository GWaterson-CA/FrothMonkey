'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface AnalyticsTrackerProps {
  listingId?: string
}

export function AnalyticsTracker({ listingId }: AnalyticsTrackerProps) {
  const pathname = usePathname()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  // Check if analytics is available on component mount
  useEffect(() => {
    const checkAnalyticsAvailability = async () => {
      try {
        // Test if analytics endpoint exists with a minimal request
        const response = await fetch('/api/analytics/page-view', {
          method: 'HEAD', // Use HEAD to avoid actually creating a record
        })
        
        // If we don't get a 404, analytics is probably available
        setAnalyticsEnabled(response.status !== 404)
      } catch (error) {
        // If fetch fails entirely, assume analytics is not available
        console.debug('Analytics not available:', error)
        setAnalyticsEnabled(false)
      }
    }

    checkAnalyticsAvailability()
  }, [])

  useEffect(() => {
    if (!analyticsEnabled) return

    // Track page view
    const trackPageView = async () => {
      try {
        // Extract UTM parameters and referrer from URL
        const urlParams = new URLSearchParams(window.location.search)
        const utmSource = urlParams.get('utm_source')
        const utmMedium = urlParams.get('utm_medium')
        const utmCampaign = urlParams.get('utm_campaign')
        const utmTerm = urlParams.get('utm_term')
        const utmContent = urlParams.get('utm_content')
        
        // Get referrer from document
        const referrer = document.referrer || null

        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            timestamp: new Date().toISOString(),
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_term: utmTerm,
            utm_content: utmContent,
            referrer: referrer
          })
        })
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('Analytics tracking failed:', error)
      }
    }

    trackPageView()
  }, [pathname, analyticsEnabled])

  useEffect(() => {
    if (!analyticsEnabled || !listingId) return

    // Track listing view if listingId is provided
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
  }, [listingId, analyticsEnabled])

  return null // This component doesn't render anything
}
