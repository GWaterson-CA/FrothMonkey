import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })
    }

    // Get user ID if authenticated (optional for tracking)
    let userId: string | null = null
    try {
      const user = await getUser()
      userId = user?.id || null
    } catch {
      // User not authenticated - that's fine, we can still track anonymously
    }

    // Get IP address and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent')

    const supabase = createClient()

    const { error } = await supabase
      .rpc('record_listing_view', {
        listing_uuid: listingId,
        user_uuid: userId,
        ip_addr: ipAddress,
        user_agent_string: userAgent
      })

    if (error) {
      console.error('Listing view tracking error:', error)
      return NextResponse.json({ error: 'Failed to track listing view' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listing view API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
