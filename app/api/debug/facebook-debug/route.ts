import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listingId')
  
  if (!listingId) {
    return NextResponse.json({ error: 'listingId parameter required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const listingUrl = `${baseUrl}/listing/${listingId}`
  
  // Facebook Sharing Debugger URL
  const facebookDebuggerUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(listingUrl)}`
  
  // Twitter Card Validator URL
  const twitterValidatorUrl = `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(listingUrl)}`
  
  // LinkedIn Post Inspector URL
  const linkedinInspectorUrl = `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(listingUrl)}`

  return NextResponse.json({
    listingUrl,
    debugUrls: {
      facebook: facebookDebuggerUrl,
      twitter: twitterValidatorUrl,
      linkedin: linkedinInspectorUrl
    },
    instructions: {
      facebook: "Use the Facebook debugger to clear cache and preview your listing",
      twitter: "Use the Twitter validator to test Twitter Card metadata",
      linkedin: "Use the LinkedIn inspector to test LinkedIn sharing"
    }
  })
}
