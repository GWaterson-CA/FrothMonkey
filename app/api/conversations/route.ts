import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Get or create conversation
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      listing_uuid: listingId,
      participant_uuid: profile.id
    })

    if (error) {
      console.error('Error getting conversation:', error)
      return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 })
    }

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        listings (
          id,
          title,
          cover_image_url
        )
      `)
      .eq('id', conversationId)
      .single()

    if (conversationError) {
      console.error('Error fetching conversation details:', conversationError)
      return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 })
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase.rpc('get_conversation_participants', {
      conversation_uuid: conversationId
    })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    return NextResponse.json({ 
      conversation: {
        ...conversation,
        participants
      }
    })
  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
