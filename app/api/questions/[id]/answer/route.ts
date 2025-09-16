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

    const { answer } = await request.json()

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
          owner_id
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

    // Update the question with the answer
    const { data, error } = await supabase
      .from('auction_questions')
      .update({
        answer: answer.trim(),
        answered_at: new Date().toISOString()
      })
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

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/questions/[id]/answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
