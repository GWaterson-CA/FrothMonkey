import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get a sample listing
    const { data: listing } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        current_price,
        start_price,
        end_time,
        status,
        cover_image_url,
        location,
        categories (
          name
        )
      `)
      .eq('status', 'live')
      .limit(1)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'No listings found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const ogImageUrl = `${baseUrl}/api/og/listing/${listing.id}`
    
    // Generate A/B CTA variant
    const ctaVariants = [
      'Bid now before it\'s too late!',
      'Don\'t miss out on this auction!',
      'Place your bid today!',
      'Join the bidding now!'
    ]
    const ctaIndex = parseInt(listing.id.slice(-1), 16) % ctaVariants.length
    const ctaText = ctaVariants[ctaIndex]

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        current_price: listing.current_price,
        start_price: listing.start_price,
        location: listing.location,
        category: listing.categories?.name
      },
      ogImageUrl,
      ctaText,
      ctaIndex,
      baseUrl,
      metadata: {
        title: `${listing.title} | FrothMonkey`,
        description: listing.description 
          ? `${listing.description.substring(0, 120)}... ${ctaText}`
          : `Auction for ${listing.title} in ${listing.location}. ${ctaText}`,
        ogImageUrl
      }
    })
  } catch (error) {
    console.error('Debug OG test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
