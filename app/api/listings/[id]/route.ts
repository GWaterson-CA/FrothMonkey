import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { z } from 'zod'

const updateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'parts']).optional(),
  startPrice: z.number().min(1, 'Starting price must be at least $1.00').multipleOf(1, 'Starting price must be in full dollars (no cents)').optional(),
  reservePrice: z.number().min(1, 'Reserve price must be at least $1.00').multipleOf(1, 'Reserve price must be in full dollars (no cents)').optional().nullable(),
  buyNowPrice: z.number().min(1, 'Buy now price must be at least $1.00').multipleOf(1, 'Buy now price must be in full dollars (no cents)').optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  additionalImages: z.array(z.object({
    path: z.string(),
    sortOrder: z.number()
  })).optional(),
})

// GET /api/listings/[id] - Get listing details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          parent_id
        ),
        listing_images (
          id,
          path,
          sort_order
        ),
        bids (
          id,
          amount
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if user can view this listing
    const canView = listing.status !== 'draft' || listing.owner_id === profile?.id
    if (!canView) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/listings/[id] - Update listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select(`
        *,
        bids (
          id,
          amount
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check ownership
    if (listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if listing can be edited
    if (['ended', 'cancelled', 'sold'].includes(listing.status)) {
      return NextResponse.json({ 
        error: 'Cannot edit listing that has ended, been cancelled, or sold' 
      }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const data = updateListingSchema.parse(body)

    const hasBids = listing.bids && listing.bids.length > 0

    // Validate price changes if bids exist
    if (hasBids) {
      if (data.startPrice && data.startPrice !== listing.start_price) {
        return NextResponse.json({ 
          error: 'Cannot change starting price after bidding has started' 
        }, { status: 400 })
      }

      if (data.reservePrice !== undefined && listing.reserve_price && 
          data.reservePrice > listing.reserve_price) {
        return NextResponse.json({ 
          error: 'Reserve price can only be lowered once bidding has started' 
        }, { status: 400 })
      }

      if (data.buyNowPrice !== undefined && listing.buy_now_price && 
          data.buyNowPrice > listing.buy_now_price) {
        return NextResponse.json({ 
          error: 'Buy Now price can only be lowered once bidding has started' 
        }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId
    if (data.condition !== undefined) updateData.condition = data.condition
    if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl

    // Only update prices if validation passed
    if (!hasBids && data.startPrice !== undefined) {
      updateData.start_price = data.startPrice
    }
    
    if (data.reservePrice !== undefined) {
      updateData.reserve_price = data.reservePrice
    }
    
    if (data.buyNowPrice !== undefined) {
      updateData.buy_now_price = data.buyNowPrice
    }

    // Update the listing
    const { error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    // Update additional images if provided
    if (data.additionalImages !== undefined) {
      // Delete existing additional images
      await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', params.id)

      // Insert new additional images
      if (data.additionalImages.length > 0) {
        const imageInserts = data.additionalImages.map(img => ({
          listing_id: params.id,
          path: img.path,
          sort_order: img.sortOrder,
        }))

        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(imageInserts)

        if (imagesError) {
          console.error('Error updating images:', imagesError)
          // Don't fail the entire operation for image errors
        }
      }
    }

    // Return updated listing
    const { data: updatedListing, error: refetchError } = await supabase
      .from('listings')
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          parent_id
        ),
        listing_images (
          id,
          path,
          sort_order
        ),
        bids (
          id,
          amount
        )
      `)
      .eq('id', params.id)
      .single()

    if (refetchError) {
      // Return success even if refetch fails
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(updatedListing)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/listings/[id] - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current listing
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select(`
        *,
        bids (
          id
        ),
        listing_images (
          path
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check ownership
    if (listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if listing can be deleted
    const hasBids = listing.bids && listing.bids.length > 0
    if (hasBids) {
      return NextResponse.json({ 
        error: 'Cannot delete listing with bids' 
      }, { status: 400 })
    }

    if (listing.status === 'sold') {
      return NextResponse.json({ 
        error: 'Cannot delete listing that has been sold' 
      }, { status: 400 })
    }

    // Use service client to bypass RLS for deletion
    const { createServiceClient } = await import('@/lib/supabase/server')
    const serviceSupabase = createServiceClient()

    // Delete images from storage
    if (listing.listing_images && listing.listing_images.length > 0) {
      const imagePaths = listing.listing_images.map(img => img.path)
      
      // Also include cover image if it exists
      if (listing.cover_image_url && !imagePaths.includes(listing.cover_image_url)) {
        imagePaths.push(listing.cover_image_url)
      }

      if (imagePaths.length > 0) {
        await serviceSupabase.storage
          .from('listing-images')
          .remove(imagePaths)
      }
    }

    // Delete listing images from database
    await serviceSupabase
      .from('listing_images')
      .delete()
      .eq('listing_id', params.id)

    // Delete the listing
    const { error: deleteError } = await serviceSupabase
      .from('listings')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
