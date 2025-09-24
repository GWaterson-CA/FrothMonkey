import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'OG Image Test | FrothMonkey',
  description: 'Test page for debugging Open Graph images and metadata',
}

export default function OGTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Open Graph Debug Tools</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Facebook Sharing Issues</h2>
          <p className="mb-4">
            If your Facebook shares aren't showing images or A/B CTA variants, this is likely due to Facebook's aggressive caching.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Solutions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Use Facebook's Sharing Debugger to clear cache</li>
              <li>Test with a fresh URL (add ?v=1 to the end)</li>
              <li>Wait 24-48 hours for cache to expire naturally</li>
              <li>Use the debug tools below to verify metadata</li>
            </ol>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Test OG Image Generation:</h3>
              <Link 
                href="/api/debug/og-test" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                /api/debug/og-test
              </Link>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Facebook Debugger URLs:</h3>
              <Link 
                href="/api/debug/facebook-debug?listingId=YOUR_LISTING_ID" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                /api/debug/facebook-debug?listingId=YOUR_LISTING_ID
              </Link>
              <p className="text-sm text-gray-600 mt-1">
                Replace YOUR_LISTING_ID with an actual listing ID
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">A/B CTA Variants</h2>
          <p className="mb-2">The system uses 4 different CTA variants:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Bid now before it's too late!"</li>
            <li>"Don't miss out on this auction!"</li>
            <li>"Place your bid today!"</li>
            <li>"Join the bidding now!"</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600">
            The variant is determined by the last character of the listing ID, ensuring consistency.
          </p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Testing Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Get a listing ID from your database</li>
            <li>Visit <code>/api/debug/og-test</code> to see sample metadata</li>
            <li>Visit <code>/api/debug/facebook-debug?listingId=YOUR_ID</code> to get debugger URLs</li>
            <li>Use Facebook's Sharing Debugger to test your listing URL</li>
            <li>If images don't appear, wait 24-48 hours or use a fresh URL</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
