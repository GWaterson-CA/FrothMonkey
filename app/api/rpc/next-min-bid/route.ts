import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const nextMinBidSchema = z.object({
  listingId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Parse and validate request body
    const body = await request.json()
    const { listingId } = nextMinBidSchema.parse(body)

    // Call the next_min_bid SQL function
    const { data, error } = await supabase.rpc('next_min_bid', {
      listing_id: listingId,
    })

    if (error) {
      console.error('Database error getting next min bid:', error)
      return NextResponse.json(
        { error: 'Failed to get minimum bid' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      minimumBid: data as number,
    })

  } catch (error) {
    console.error('Error in next-min-bid API:', error)
    
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
