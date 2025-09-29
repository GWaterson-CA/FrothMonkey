import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiting storage (in production, use Redis or similar)
const bidAttempts = new Map<string, { count: number; lastAttempt: number }>()

const placeBidSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().min(1, 'Bid must be at least $1.00').multipleOf(1, 'Bids must be in full dollars (no cents)'),
  isBuyNow: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed in place-bid:', authError)
      return NextResponse.json(
        { error: 'Authentication required. Please log in and try again.' },
        { status: 401 }
      )
    }

    // Check if user has accepted the bidding agreement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('bidding_agreement_accepted_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error in place-bid:', profileError)
      return NextResponse.json(
        { error: 'Unable to verify user profile. Please try again.' },
        { status: 500 }
      )
    }
    
    if (!profile?.bidding_agreement_accepted_at) {
      return NextResponse.json(
        { error: 'You must accept the bidding agreement before placing bids' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { listingId, amount, isBuyNow } = placeBidSchema.parse(body)

    // Rate limiting: 1 bid per user per listing per 2 seconds
    const rateLimitKey = `${user.id}-${listingId}`
    const now = Date.now()
    const userAttempts = bidAttempts.get(rateLimitKey)

    if (userAttempts && now - userAttempts.lastAttempt < 2000) {
      return NextResponse.json(
        { error: 'Please wait before placing another bid' },
        { status: 429 }
      )
    }

    // Update rate limiting
    bidAttempts.set(rateLimitKey, { count: 1, lastAttempt: now })

    // Call the place_bid SQL function
    // For Buy Now, handle logic in API since database function may not support it
    if (isBuyNow) {
      // Get listing info to check if Buy Now is available
      const { data: listing } = await supabase
        .from('listings')
        .select('buy_now_enabled, buy_now_price, reserve_met')
        .eq('id', listingId)
        .single()
      
      if (listing?.reserve_met) {
        return NextResponse.json(
          { error: 'Buy Now is no longer available - reserve price has been reached' },
          { status: 400 }
        )
      }
    }
    
    // Use the standard 3-parameter function (most reliable)
    const { data, error } = await supabase.rpc('place_bid', {
      listing_id: listingId,
      bid_amount: amount,
      bidder: user.id,
    })

    if (error) {
      console.error('Database error placing bid:', {
        error,
        listingId,
        amount,
        userId: user.id,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details
      })
      return NextResponse.json(
        { 
          error: 'Failed to place bid',
          details: error.message || 'Database error occurred'
        },
        { status: 500 }
      )
    }

    const result = data as {
      accepted: boolean
      reason?: string
      minimum_required?: number
      new_highest?: number
      end_time?: string
      buy_now?: boolean
    }

    if (!result.accepted) {
      return NextResponse.json(
        { 
          error: result.reason || 'Bid was rejected',
          minimumRequired: result.minimum_required 
        },
        { status: 400 }
      )
    }

    // Successful bid
    return NextResponse.json({
      success: true,
      newHighest: result.new_highest,
      endTime: result.end_time,
      buyNow: result.buy_now || false,
    })

  } catch (error) {
    console.error('Error in place-bid API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
