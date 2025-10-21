import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const cancelAutoBidSchema = z.object({
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
    const { listingId } = cancelAutoBidSchema.parse(body)

    // Call the cancel_auto_bid SQL function
    const { data, error } = await supabase.rpc('cancel_auto_bid', {
      p_user_id: user.id,
      p_listing_id: listingId,
    })

    if (error) {
      console.error('Database error canceling auto-bid:', error)
      return NextResponse.json(
        { 
          error: 'Failed to cancel auto-bid',
          details: error.message 
        },
        { status: 500 }
      )
    }

    const result = data as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel auto-bid' },
        { status: 400 }
      )
    }

    // Successfully canceled
    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error in cancel auto-bid:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

