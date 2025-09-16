import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiting storage (in production, use Redis or similar)
const bidAttempts = new Map<string, { count: number; lastAttempt: number }>()

const placeBidSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { listingId, amount } = placeBidSchema.parse(body)

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
    const { data, error } = await supabase.rpc('place_bid', {
      listing_id: listingId,
      bid_amount: amount,
      bidder: user.id,
    })

    if (error) {
      console.error('Database error placing bid:', error)
      return NextResponse.json(
        { error: 'Failed to place bid' },
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
