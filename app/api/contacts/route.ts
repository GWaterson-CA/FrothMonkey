import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'

// Get all contact exchanges for the current user
export async function GET(request: NextRequest) {
  try {
    const profile = await requireProfile()
    const supabase = createClient()

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'seller' or 'buyer'

    let query = supabase
      .from('auction_contacts')
      .select(`
        *,
        listing:listings (
          id,
          title,
          cover_image_url,
          location,
          end_time
        ),
        seller:profiles!auction_contacts_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        buyer:profiles!auction_contacts_buyer_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        unread_count:auction_messages!auction_messages_contact_id_fkey (
          count
        )
      `)

    // Filter by role
    if (role === 'seller') {
      query = query.eq('seller_id', profile.id)
    } else if (role === 'buyer') {
      query = query.eq('buyer_id', profile.id)
    } else {
      // Get both seller and buyer contacts
      query = query.or(`seller_id.eq.${profile.id},buyer_id.eq.${profile.id}`)
    }

    const { data: contacts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json(contacts || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
