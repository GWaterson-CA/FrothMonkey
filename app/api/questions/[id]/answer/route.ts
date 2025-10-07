import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

// PATCH /api/questions/[id]/answer - Answer a question
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const profile = await getUserProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { answer, image_paths } = await request.json()

    if (!answer?.trim()) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      )
    }

    const questionId = params.id

    // Check if question exists and user is the listing owner
    const { data: question, error: questionError } = await supabase
      .from('auction_questions')
      .select(`
        *,
        listings!auction_questions_listing_id_fkey (
          owner_id,
          id
        )
      `)
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    // @ts-ignore - TypeScript doesn't recognize the joined relation structure
    if (question.listings?.owner_id !== profile.id) {
      return NextResponse.json(
        { error: 'Only the listing owner can answer questions' },
        { status: 403 }
      )
    }

    if (question.answer) {
      return NextResponse.json(
        { error: 'Question has already been answered' },
        { status: 400 }
      )
    }

    // Update the question with the answer and images
    const updateData: any = {
      answer: answer.trim(),
      answered_at: new Date().toISOString()
    }

    if (image_paths && image_paths.length > 0) {
      updateData.answer_images = image_paths
    }

    const { data, error } = await supabase
      .from('auction_questions')
      .update(updateData)
      .eq('id', questionId)
      .select(`
        *,
        profiles!auction_questions_questioner_id_fkey (
          username,
          full_name
        )
      `)
      .single()

    if (error) {
      console.error('Error answering question:', error)
      return NextResponse.json(
        { error: 'Failed to answer question' },
        { status: 500 }
      )
    }

    // If images were uploaded, add them to the listing's images as well
    if (image_paths && image_paths.length > 0) {
      // @ts-ignore
      const listingId = question.listings?.id

      // Get current listing images count for proper sort order
      const { data: existingImages } = await supabase
        .from('listing_images')
        .select('sort_order')
        .eq('listing_id', listingId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const startingSortOrder = existingImages && existingImages.length > 0 
        ? (existingImages[0].sort_order || 0) + 1 
        : 1

      // Insert images into listing_images table
      const imageInserts = image_paths.map((path: string, index: number) => ({
        listing_id: listingId,
        path: path,
        sort_order: startingSortOrder + index,
      }))

      const { error: imagesError } = await supabase
        .from('listing_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Error adding images to listing:', imagesError)
        // Don't fail the entire operation if adding to listing fails
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/questions/[id]/answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
