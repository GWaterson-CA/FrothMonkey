import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

// POST /api/reviews - Create a new review
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

    const { transaction_id, reviewee_id, rating, comment } = await request.json()

    if (!transaction_id || !reviewee_id || !rating) {
      return NextResponse.json(
        { error: 'transaction_id, reviewee_id, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (profile.id === reviewee_id) {
      return NextResponse.json(
        { error: 'Cannot review yourself' },
        { status: 400 }
      )
    }

    // Check if user can review this transaction
    const { data: canReview, error: checkError } = await supabase
      .rpc('can_review_user', {
        transaction_uuid: transaction_id,
        reviewer_uuid: profile.id,
        reviewee_uuid: reviewee_id
      })

    if (checkError || !canReview) {
      return NextResponse.json(
        { error: 'You cannot review this user for this transaction' },
        { status: 403 }
      )
    }

    // Create the review
    const { data, error } = await supabase
      .from('user_reviews')
      .insert({
        transaction_id,
        reviewer_id: profile.id,
        reviewee_id,
        rating,
        comment: comment?.trim() || null
      })
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          username
        ),
        reviewee:profiles!user_reviews_reviewee_id_fkey (
          username
        )
      `)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/reviews?user_id=xxx - Get reviews for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Get reviews for the user
    const { data: reviews, error } = await supabase
      .from('user_reviews')
      .select(`
        *,
        reviewer:profiles!user_reviews_reviewer_id_fkey (
          username
        ),
        transaction:transactions (
          id,
          final_price,
          listing:listings (
            title
          )
        )
      `)
      .eq('reviewee_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    // Get user's rating summary
    const { data: ratingData, error: ratingError } = await supabase
      .rpc('get_user_rating', { user_uuid: user_id })

    let ratingSummary = null
    if (!ratingError && ratingData) {
      ratingSummary = ratingData
    }

    return NextResponse.json({
      reviews: reviews || [],
      rating_summary: ratingSummary,
      has_more: (reviews?.length || 0) === limit
    })
  } catch (error) {
    console.error('Error in GET /api/reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
