import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

// HEAD handler for analytics availability check
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const { path, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer } = await request.json()

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
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
      .rpc('record_page_view', {
        page_path: path,
        user_uuid: userId,
        ip_addr: ipAddress,
        user_agent_string: userAgent,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        referrer: referrer || null
      })

    if (error) {
      console.error('Page view tracking error:', error)
      return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Page view API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
