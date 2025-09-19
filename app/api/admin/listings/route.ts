import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()

    const supabase = createClient()

    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        status,
        current_price,
        start_price,
        created_at,
        end_time,
        owner:profiles!owner_id(
          id,
          username,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Listings fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Listings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('id')

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('admin_delete_listing', { listing_uuid: listingId })

    if (error) {
      console.error('Listing deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Listing deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
