import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendNotificationEmail, shouldSendEmail } from '@/lib/email/send-notification-email'

// POST /api/email/send-notification - Send an email based on notification data
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { 
      userId, 
      notificationType, 
      notificationData,
      testMode = false 
    } = body

    // Validate required fields
    if (!userId || !notificationType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, notificationType' },
        { status: 400 }
      )
    }

    // Get user profile and email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name, notification_preferences')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get user email from auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !user?.email) {
      console.error('Error fetching user email:', authError)
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    // Check if user has email notifications enabled (unless test mode)
    if (!testMode) {
      const shouldSend = await shouldSendEmail(
        profile.notification_preferences,
        notificationType
      )

      if (!shouldSend) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'User has disabled this notification type'
        })
      }
    }

    // Send the email
    const recipientName = profile.full_name || profile.username || 'User'
    
    const result = await sendNotificationEmail({
      recipientEmail: user.email,
      recipientName,
      notificationType,
      data: notificationData
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-notification API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

