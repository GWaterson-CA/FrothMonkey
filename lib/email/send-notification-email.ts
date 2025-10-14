import { resend, EMAIL_FROM, APP_URL } from './resend-client'
import { render } from '@react-email/render'
import React from 'react'
import {
  OutbidEmail,
  TimeWarningEmail,
  AuctionEndedSellerEmail,
  AuctionWonBuyerEmail,
  TestEmail,
  ConfirmEmail,
  ResetPasswordEmail,
  FavoriteReserveMetEmail,
  FavoriteEndingSoonEmail
} from './templates'

interface NotificationEmailData {
  recipientEmail: string
  recipientName: string
  notificationType: string
  data: any
}

export async function sendNotificationEmail({
  recipientEmail,
  recipientName,
  notificationType,
  data
}: NotificationEmailData) {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured in environment variables')
      return { 
        success: false, 
        error: 'Email service not configured. RESEND_API_KEY is missing.' 
      }
    }

    console.log(`[Email] Preparing to send ${notificationType} email to ${recipientEmail}`)

    let subject = ''
    let reactContent: React.ReactElement | null = null

    switch (notificationType) {
      case 'bid_outbid':
        subject = `You've been outbid on "${data.listingTitle}"`
        reactContent = React.createElement(OutbidEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          previousBid: data.previousBid,
          newBid: data.newBid
        })
        break

      case 'time_warning_1h':
      case 'time_warning_2h':
      case 'time_warning_3h':
      case 'time_warning_6h':
      case 'time_warning_12h':
      case 'time_warning_24h':
      case 'time_warning_48h':
        const hours = parseInt(notificationType.replace('time_warning_', '').replace('h', ''))
        subject = `${hours} hour${hours === 1 ? '' : 's'} left on "${data.listingTitle}"`
        reactContent = React.createElement(TimeWarningEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          currentBid: data.currentBid,
          hoursRemaining: hours,
          isLeadingBidder: data.isLeadingBidder || false
        })
        break

      case 'listing_ended_seller':
        subject = data.reserveMet 
          ? `Your auction sold: "${data.listingTitle}"`
          : `Your auction ended: "${data.listingTitle}"`
        reactContent = React.createElement(AuctionEndedSellerEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          finalBid: data.finalBid,
          buyerName: data.buyerName,
          reserveMet: data.reserveMet,
          hadBids: data.hadBids
        })
        break

      case 'auction_won':
        subject = `Congratulations! You won "${data.listingTitle}"`
        reactContent = React.createElement(AuctionWonBuyerEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          finalBid: data.finalBid,
          sellerName: data.sellerName
        })
        break

      case 'test_email':
        subject = 'Test Email from FrothMonkey'
        reactContent = React.createElement(TestEmail, {
          recipientName,
          testMessage: data.message || 'This is a test email from FrothMonkey. If you received this, the email system is working correctly!'
        })
        break

      case 'confirm_email':
        subject = 'Welcome to FrothMonkey - Confirm Your Email'
        reactContent = React.createElement(ConfirmEmail, {
          recipientName,
          confirmationUrl: data.confirmationUrl || `${APP_URL}/auth/confirm`
        })
        break

      case 'reset_password':
        subject = 'Reset Your FrothMonkey Password'
        reactContent = React.createElement(ResetPasswordEmail, {
          recipientName,
          resetUrl: data.resetUrl || `${APP_URL}/auth/reset-password`
        })
        break

      case 'favorite_reserve_met':
        subject = `Reserve met on "${data.listingTitle}"`
        reactContent = React.createElement(FavoriteReserveMetEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          currentBid: data.currentBid,
          timeRemaining: data.timeRemaining
        })
        break

      case 'favorite_ending_soon':
        subject = `Less than 24h left on "${data.listingTitle}"`
        reactContent = React.createElement(FavoriteEndingSoonEmail, {
          recipientName,
          listingTitle: data.listingTitle,
          listingUrl: `${APP_URL}/listing/${data.listingId}`,
          currentBid: data.currentBid,
          reserveMet: data.reserveMet || false
        })
        break

      default:
        console.error(`[Email] No email template for notification type: ${notificationType}`)
        return { success: false, error: `Unknown notification type: ${notificationType}` }
    }

    if (!reactContent) {
      console.error('[Email] Failed to generate email content')
      return { success: false, error: 'Failed to generate email content' }
    }

    console.log('[Email] Rendering email template...')
    console.log('[Email] React content type:', typeof reactContent)
    
    // Render React component to HTML
    const htmlContent = await render(reactContent)

    console.log('[Email] HTML content length:', htmlContent.length)
    console.log('[Email] HTML content type:', typeof htmlContent)
    console.log('[Email] HTML preview (first 200 chars):', htmlContent.substring(0, 200))

    console.log(`[Email] Sending email via Resend...`)
    console.log(`[Email] From: ${EMAIL_FROM}`)
    console.log(`[Email] To: ${recipientEmail}`)
    console.log(`[Email] Subject: ${subject}`)

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      subject,
      html: htmlContent
    })

    console.log(`[Email] ✅ Email sent successfully to ${recipientEmail}`)
    console.log('[Email] Resend response:', JSON.stringify(result, null, 2))
    
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[Email] ❌ Error sending email:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('[Email] Error name:', error.name)
      console.error('[Email] Error message:', error.message)
      console.error('[Email] Error stack:', error.stack)
    }
    
    // Check for specific Resend API errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('API key')) {
      return { 
        success: false, 
        error: 'Invalid or missing Resend API key. Please check your RESEND_API_KEY environment variable.' 
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

// Helper function to check if user has email notifications enabled
export async function shouldSendEmail(
  notificationPreferences: any,
  notificationType: string
): Promise<boolean> {
  // Check if master email switch is on
  if (!notificationPreferences?.email_notifications) {
    return false
  }

  // Map notification type to preference key
  const preferenceMap: Record<string, string> = {
    'bid_outbid': 'bid_outbid',
    'auction_won': 'auction_won',
    'listing_ended': 'listing_ended',
    'listing_ended_seller': 'listing_ended',
    'time_warning_1h': 'time_warning_enabled',
    'time_warning_2h': 'time_warning_enabled',
    'time_warning_3h': 'time_warning_enabled',
    'time_warning_6h': 'time_warning_enabled',
    'time_warning_12h': 'time_warning_enabled',
    'time_warning_24h': 'time_warning_enabled',
    'time_warning_48h': 'time_warning_enabled',
    'favorite_reserve_met': 'favorite_notifications',
    'favorite_ending_soon': 'favorite_notifications'
  }

  const preferenceKey = preferenceMap[notificationType]
  if (!preferenceKey) {
    return false
  }

  return notificationPreferences[preferenceKey] !== false
}

