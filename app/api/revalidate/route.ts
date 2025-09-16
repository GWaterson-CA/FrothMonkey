import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { z } from 'zod'

const revalidateSchema = z.object({
  tags: z.array(z.string()).optional().default([]),
  paths: z.array(z.string()).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.REVALIDATE_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { tags, paths } = revalidateSchema.parse(body)

    // Revalidate tags
    for (const tag of tags) {
      revalidateTag(tag)
    }

    // Revalidate paths
    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({
      success: true,
      revalidated: {
        tags,
        paths,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error in revalidate API:', error)
    
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
