import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

// GET /api/reviews/pending - Get transactions that can be reviewed by current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get completed transactions where user was buyer or seller
    // and they haven't reviewed the other party yet
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        buyer_id,
        final_price,
        created_at,
        listing:listings (
          id,
          title,
          owner_id,
          cover_image_url,
          seller:profiles!listings_owner_id_fkey (
            id,
            username
          )
        ),
        buyer:profiles!transactions_buyer_id_fkey (
          id,
          username
        )
      `)
      .eq('status', 'pending')
      .or(`buyer_id.eq.${profile.id},listings.owner_id.eq.${profile.id}`)

    if (error) {
      console.error('Error fetching pending transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending transactions' },
        { status: 500 }
      )
    }

    const pendingReviews = []

    for (const transaction of transactions || []) {
      const isBuyer = transaction.buyer_id === profile.id
      const otherPartyId = isBuyer 
        ? transaction.listing.seller.id 
        : transaction.buyer.id
      const otherPartyUsername = isBuyer 
        ? transaction.listing.seller.username 
        : transaction.buyer.username

      // Check if user has already reviewed the other party for this transaction
      const { data: existingReview } = await supabase
        .from('user_reviews')
        .select('id')
        .eq('transaction_id', transaction.id)
        .eq('reviewer_id', profile.id)
        .eq('reviewee_id', otherPartyId)
        .single()

      if (!existingReview) {
        pendingReviews.push({
          transaction_id: transaction.id,
          listing_title: transaction.listing.title,
          listing_id: transaction.listing.id,
          final_price: transaction.final_price,
          created_at: transaction.created_at,
          other_party: {
            id: otherPartyId,
            username: otherPartyUsername,
            role: isBuyer ? 'seller' : 'buyer'
          },
          user_role: isBuyer ? 'buyer' : 'seller'
        })
      }
    }

    return NextResponse.json({
      pending_reviews: pendingReviews
    })
  } catch (error) {
    console.error('Error in GET /api/reviews/pending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
