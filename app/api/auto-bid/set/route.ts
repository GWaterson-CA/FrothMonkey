import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const setAutoBidSchema = z.object({
  listingId: z.string().uuid(),
  maxAmount: z.number().min(1, 'Maximum bid must be at least $1.00').multipleOf(1, 'Bids must be in full dollars (no cents)'),
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

    // Check if user has accepted the bidding agreement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('bidding_agreement_accepted_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Unable to verify user profile' },
        { status: 500 }
      )
    }
    
    if (!profile?.bidding_agreement_accepted_at) {
      return NextResponse.json(
        { error: 'You must accept the bidding agreement before setting up auto-bid' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { listingId, maxAmount } = setAutoBidSchema.parse(body)

    // Call the set_auto_bid SQL function
    const { data, error } = await supabase.rpc('set_auto_bid', {
      p_user_id: user.id,
      p_listing_id: listingId,
      p_max_amount: maxAmount,
    })

    if (error) {
      console.error('Database error setting auto-bid:', error)
      return NextResponse.json(
        { 
          error: 'Failed to set auto-bid',
          details: error.message 
        },
        { status: 500 }
      )
    }

    const result = data as {
      success: boolean
      error?: string
      auto_bid_id?: string
      max_amount?: number
      minimum_required?: number
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to set auto-bid',
          minimumRequired: result.minimum_required
        },
        { status: 400 }
      )
    }

    // Successful auto-bid setup
    return NextResponse.json({
      success: true,
      autoBidId: result.auto_bid_id,
      maxAmount: result.max_amount,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error in set auto-bid:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

