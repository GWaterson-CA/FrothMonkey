import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { listing_id, question } = await request.json()

    if (!listing_id || !question?.trim()) {
      return NextResponse.json(
        { error: 'listing_id and question are required' },
        { status: 400 }
      )
    }

    // Check if listing exists and user can ask questions on it
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, owner_id, status')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.owner_id === profile.id) {
      return NextResponse.json(
        { error: 'Cannot ask questions on your own listing' },
        { status: 400 }
      )
    }

    if (!['live', 'scheduled'].includes(listing.status)) {
      return NextResponse.json(
        { error: 'Questions can only be asked on live or scheduled auctions' },
        { status: 400 }
      )
    }

    // Create the question
    const { data, error } = await supabase
      .from('auction_questions')
      .insert({
        listing_id,
        questioner_id: profile.id,
        question: question.trim()
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/questions?listing_id=xxx - Get questions for a listing
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()
    const { searchParams } = new URL(request.url)
    const listing_id = searchParams.get('listing_id')

    if (!listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      )
    }

    // Check if listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, owner_id, status')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Get questions based on user permissions
    let query = supabase
      .from('auction_questions')
      .select(`
        *,
        profiles!auction_questions_questioner_id_fkey (
          username,
          full_name
        )
      `)
      .eq('listing_id', listing_id)
      .order('created_at', { ascending: true })

    // If user is not the listing owner, only show answered questions
    if (!profile || profile.id !== listing.owner_id) {
      query = query.not('answer', 'is', null)
    }

    const { data: questions, error } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    // Get unanswered count if user is listing owner
    let unansweredCount = 0
    if (profile?.id === listing.owner_id) {
      const { data: countData, error: countError } = await supabase
        .rpc('get_unanswered_questions_count', { listing_uuid: listing_id })

      if (!countError && countData !== null) {
        unansweredCount = countData
      }
    }

    return NextResponse.json({
      questions: questions || [],
      unanswered_count: unansweredCount
    })
  } catch (error) {
    console.error('Error in GET /api/questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
