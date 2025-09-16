import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const uploadRequestSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
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

    // Parse request body
    const body = await request.json()
    const { fileName, fileType, listingId } = uploadRequestSchema.parse(body)

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to upload to this listing' },
        { status: 403 }
      )
    }

    // Generate unique file name
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${listingId}/${crypto.randomUUID()}.${fileExtension}`

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from('listing-images')
      .createSignedUploadUrl(uniqueFileName, {
        upsert: true,
      })

    if (error) {
      console.error('Error creating signed upload URL:', error)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: uniqueFileName,
    })

  } catch (error) {
    console.error('Error in upload API:', error)
    
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
