import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email/send-notification-email'

// POST /api/email/send-test - Send a test email (admin only)
export async function POST(request: Request) {
  try {
    console.log('[API] /api/email/send-test - Request received')
    
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('[API] Unauthorized - No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[API] User authenticated: ${user.id}`)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      console.log('[API] Forbidden - User is not admin')
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    console.log('[API] Admin access verified')

    const body = await request.json()
    
    const { 
      recipientEmail,
      recipientName,
      notificationType,
      notificationData
    } = body

    console.log('[API] Request body:', { recipientEmail, recipientName, notificationType })

    // Validate required fields
    if (!recipientEmail || !notificationType) {
      console.log('[API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, notificationType' },
        { status: 400 }
      )
    }

    // Check environment variable
    if (!process.env.RESEND_API_KEY) {
      console.error('[API] ❌ RESEND_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    console.log('[API] RESEND_API_KEY is configured')
    console.log('[API] Calling sendNotificationEmail...')

    // Send the test email
    const result = await sendNotificationEmail({
      recipientEmail,
      recipientName: recipientName || 'Test User',
      notificationType,
      data: notificationData || {}
    })

    console.log('[API] sendNotificationEmail result:', result)

    if (result.success) {
      console.log('[API] ✅ Email sent successfully, messageId:', result.messageId)
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      console.error('[API] ❌ Failed to send email:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API] ❌ Exception in send-test API:', error)
    if (error instanceof Error) {
      console.error('[API] Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

