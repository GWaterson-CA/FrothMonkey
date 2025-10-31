import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'

// Get messages for a contact exchange
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await requireProfile()
    const supabase = createClient()

    // Verify user is part of this contact exchange
    const { data: contact } = await supabase
      .from('auction_contacts')
      .select('seller_id, buyer_id, status')
      .eq('id', params.id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.seller_id !== profile.id && contact.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('auction_messages')
      .select(`
        *,
        sender:profiles!auction_messages_sender_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        recipient:profiles!auction_messages_recipient_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('contact_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark unread messages as read
    await supabase
      .from('auction_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('contact_id', params.id)
      .eq('recipient_id', profile.id)
      .is('read_at', null)

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await requireProfile()
    const supabase = createClient()
    const body = await request.json()
    const { message } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 })
    }

    // Verify user is part of this contact exchange and it's approved
    const { data: contact } = await supabase
      .from('auction_contacts')
      .select('seller_id, buyer_id, status, listing_id')
      .eq('id', params.id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.seller_id !== profile.id && contact.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['approved', 'auto_approved'].includes(contact.status)) {
      return NextResponse.json({ error: 'Contact exchange not approved' }, { status: 400 })
    }

    // Determine recipient
    const recipientId = contact.seller_id === profile.id 
      ? contact.buyer_id 
      : contact.seller_id

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('auction_messages')
      .insert({
        contact_id: params.id,
        sender_id: profile.id,
        recipient_id: recipientId,
        message: message.trim()
      })
      .select(`
        *,
        sender:profiles!auction_messages_sender_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        recipient:profiles!auction_messages_recipient_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Create notification for recipient
    await supabase.rpc('create_notification', {
      p_user_id: recipientId,
      p_type: 'new_message',
      p_title: 'New Message',
      p_message: `${profile.username || profile.full_name || 'Someone'} sent you a message`,
      p_listing_id: contact.listing_id,
      p_related_user_id: profile.id,
      p_metadata: { contact_id: params.id }
    })

    return NextResponse.json(newMessage)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
