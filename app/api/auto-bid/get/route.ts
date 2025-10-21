import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const getAutoBidSchema = z.object({
  listingId: z.string().uuid(),
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
    const { listingId } = getAutoBidSchema.parse(body)

    // Call the get_auto_bid SQL function
    const { data, error } = await supabase.rpc('get_auto_bid', {
      p_user_id: user.id,
      p_listing_id: listingId,
    })

    if (error) {
      console.error('Database error getting auto-bid:', error)
      return NextResponse.json(
        { 
          error: 'Failed to get auto-bid',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // data will be an array with 0 or 1 elements
    const autoBid = Array.isArray(data) && data.length > 0 ? data[0] : null

    return NextResponse.json({
      autoBid: autoBid ? {
        id: autoBid.id,
        maxAmount: autoBid.max_amount,
        enabled: autoBid.enabled,
        createdAt: autoBid.created_at,
        updatedAt: autoBid.updated_at,
      } : null,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error in get auto-bid:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

