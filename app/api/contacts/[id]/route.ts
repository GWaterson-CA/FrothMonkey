import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'

// Get contact exchange details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await requireProfile()
    const supabase = createClient()

    const { data: contact, error } = await supabase
      .from('auction_contacts')
      .select(`
        *,
        listing:listings (
          id,
          title,
          cover_image_url,
          location
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
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Verify user is part of this contact exchange
    if (contact.seller_id !== profile.id && contact.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update contact exchange status (approve/decline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await requireProfile()
    const supabase = createClient()
    const body = await request.json()
    const { action } = body

    if (!['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Verify user is the seller
    const { data: contact } = await supabase
      .from('auction_contacts')
      .select('seller_id, status')
      .eq('id', params.id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.seller_id !== profile.id) {
      return NextResponse.json({ error: 'Only the seller can update this' }, { status: 403 })
    }

    if (contact.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Contact exchange already processed' }, { status: 400 })
    }

    // Call the appropriate function
    const functionName = action === 'approve' 
      ? 'approve_contact_exchange' 
      : 'decline_contact_exchange'

    const { data, error } = await supabase.rpc(functionName, {
      p_contact_id: params.id
    })

    if (error) {
      console.error(`Error ${action}ing contact:`, error)
      return NextResponse.json({ error: `Failed to ${action} contact` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
