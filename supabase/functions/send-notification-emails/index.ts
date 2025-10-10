// Supabase Edge Function to send notification emails
// This function is triggered by database webhooks when new notifications are created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get email-safe image URLs
// Extracts real Supabase Storage URLs from Next.js image optimizer paths
function getEmailSafeImageUrl(url: string | null | undefined, appUrl: string, supabaseUrl: string): string {
  const placeholderUrl = `${appUrl}/placeholder-image.jpg`
  
  console.log(`[IMAGE URL DEBUG] Original URL: ${url}`)
  
  // If no URL provided, return placeholder
  if (!url) {
    console.log('[IMAGE URL DEBUG] No URL provided, using placeholder')
    return placeholderUrl
  }
  
  // Check if it's a Next.js image optimizer URL (_next/image?url=...)
  if (url.includes('_next/image')) {
    try {
      // Extract the url parameter from the query string
      const urlMatch = url.match(/[?&]url=([^&]+)/)
      if (urlMatch && urlMatch[1]) {
        const decodedUrl = decodeURIComponent(urlMatch[1])
        console.log(`[IMAGE URL DEBUG] Decoded from Next.js optimizer: ${decodedUrl}`)
        
        // If it's already a full URL, return it
        if (decodedUrl.startsWith('http')) {
          console.log(`[IMAGE URL DEBUG] Already full URL: ${decodedUrl}`)
          return decodedUrl
        }
        
        // If it's a Supabase storage path, construct full URL
        if (decodedUrl.includes('/storage/v1/object/public/')) {
          const finalUrl = decodedUrl.startsWith('/') ? `${supabaseUrl}${decodedUrl}` : `${supabaseUrl}/${decodedUrl}`
          console.log(`[IMAGE URL DEBUG] Constructed Supabase URL: ${finalUrl}`)
          return finalUrl
        }
        
        // If decoded URL is relative path without storage prefix, assume it's in listing-images bucket
        const cleanPath = decodedUrl.startsWith('/') ? decodedUrl.slice(1) : decodedUrl
        
        // Check if path has an extension
        const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanPath)
        const pathWithExtension = hasExtension ? cleanPath : `${cleanPath}.jpg`
        
        const finalUrl = `${supabaseUrl}/storage/v1/object/public/listing-images/${pathWithExtension}`
        console.log(`[IMAGE URL DEBUG] Constructed listing-images URL: ${finalUrl}`)
        if (!hasExtension) {
          console.log(`[IMAGE URL DEBUG] Added .jpg extension to decoded path`)
        }
        return finalUrl
      }
    } catch (error) {
      console.error('[IMAGE URL DEBUG] Error parsing Next.js image URL:', error)
      return placeholderUrl
    }
  }
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) {
    console.log(`[IMAGE URL DEBUG] Full URL: ${url}`)
    return url
  }
  
  // If it's a Supabase storage path
  if (url.includes('/storage/v1/object/public/')) {
    const finalUrl = url.startsWith('/') ? `${supabaseUrl}${url}` : `${supabaseUrl}/${url}`
    console.log(`[IMAGE URL DEBUG] Supabase storage path: ${finalUrl}`)
    return finalUrl
  }
  
  // If it's a relative path, assume it's in listing-images bucket
  const cleanPath = url.startsWith('/') ? url.slice(1) : url
  
  // Check if path already has an extension
  const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanPath)
  
  // If no extension, assume .jpg (most common for listing images)
  const pathWithExtension = hasExtension ? cleanPath : `${cleanPath}.jpg`
  
  const finalUrl = `${supabaseUrl}/storage/v1/object/public/listing-images/${pathWithExtension}`
  console.log(`[IMAGE URL DEBUG] Relative path converted: ${finalUrl}`)
  if (!hasExtension) {
    console.log(`[IMAGE URL DEBUG] Added .jpg extension to path`)
  }
  return finalUrl
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://frothmonkey.com'
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the notification data from the request
    const { record } = await req.json()
    
    if (!record) {
      return new Response(
        JSON.stringify({ error: 'No notification record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const notification = record
    
    // Only send emails for specific notification types
    const emailableTypes = [
      'bid_outbid',
      'auction_won',
      'listing_ended_seller',
      'time_warning_1h',
      'time_warning_2h',
      'time_warning_3h',
      'time_warning_6h',
      'time_warning_12h',
      'time_warning_24h',
      'time_warning_48h'
    ]
    
    if (!emailableTypes.includes(notification.type)) {
      console.log(`Skipping email for notification type: ${notification.type}`)
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user email and profile
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(notification.user_id)
    
    if (authError || !user?.email) {
      console.error('Error fetching user email:', authError)
      return new Response(
        JSON.stringify({ error: 'User email not found', details: authError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile for preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, notification_preferences')
      .eq('id', notification.user_id)
      .single()

    // Check if user has email notifications enabled
    const preferences = profile?.notification_preferences || {}
    if (preferences.email_notifications === false) {
      console.log('User has email notifications disabled')
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Email notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check specific notification type preference
    if (notification.type === 'bid_outbid' && preferences.bid_outbid === false) {
      console.log('User has outbid notifications disabled')
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Outbid notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending email to: ${user.email}`)

    // Get listing data if listing_id is present
    let listingData = null
    if (notification.listing_id) {
      const { data } = await supabase
        .from('listings')
        .select('id, title, current_price, cover_image_url')
        .eq('id', notification.listing_id)
        .single()
      
      listingData = data
    }

    const recipientName = profile?.full_name || profile?.username || 'User'
    const listingTitle = listingData?.title || 'Unknown Listing'
    const listingUrl = `${appUrl}/listing/${notification.listing_id}`
    
    // Get email-safe image URL (handles Next.js image optimizer URLs)
    const listingImage = getEmailSafeImageUrl(listingData?.cover_image_url, appUrl, supabaseUrl)
    console.log(`✅ Final email image URL: ${listingImage}`)

    // Build email content based on notification type
    let subject = ''
    let htmlContent = ''

    if (notification.type === 'bid_outbid') {
      const previousBid = notification.metadata?.previous_bid || 0
      const newBid = notification.metadata?.new_bid || 0
      
      subject = `You've been outbid on "${listingTitle}"`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
              .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
              .content { padding: 20px; background-color: #f9fafb; }
              .listing-preview { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .listing-image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
              .listing-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 0; }
              .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png" alt="FrothMonkey" class="logo" />
                <h1>😔 You've Been Outbid!</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>Someone has placed a higher bid on an auction you were winning. Don't let it slip away!</p>
                <div class="listing-preview">
                  <img src="${listingImage}" alt="${listingTitle}" class="listing-image" />
                  <h2 class="listing-title">${listingTitle}</h2>
                </div>
                <div class="details">
                  <div class="detail-row">
                    <span><strong>Listing:</strong></span>
                    <span>${listingTitle}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Your Bid:</strong></span>
                    <span>$${previousBid.toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Current Bid:</strong></span>
                    <span>$${newBid.toFixed(2)}</span>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${listingUrl}" class="button">Place a Higher Bid</a>
                </div>
              </div>
              <div class="footer">
                <p>You're receiving this because you have email notifications enabled.</p>
                <p><a href="${appUrl}/account/settings">Manage your notification preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    } else if (notification.type.startsWith('time_warning_')) {
      // Extract hours from notification type (e.g., 'time_warning_24h' -> 24)
      const hoursMatch = notification.type.match(/time_warning_(\d+)h/)
      const hoursRemaining = hoursMatch ? parseInt(hoursMatch[1]) : 0
      const hourText = hoursRemaining === 1 ? 'hour' : 'hours'
      const isLeadingBidder = notification.metadata?.is_leading_bidder || false
      const currentBid = listingData?.current_price || 0

      subject = `⏰ ${hoursRemaining} ${hourText} left on "${listingTitle}"`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
              .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
              .content { padding: 20px; background-color: #f9fafb; }
              .listing-preview { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .listing-image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
              .listing-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 0; }
              .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png" alt="FrothMonkey" class="logo" />
                <h1>⏰ Auction Ending Soon!</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>An auction you're bidding on is ending in ${hoursRemaining} ${hourText}!
                ${isLeadingBidder ? " You're currently the highest bidder." : " Time to make your move!"}</p>
                <div class="listing-preview">
                  <img src="${listingImage}" alt="${listingTitle}" class="listing-image" />
                  <h2 class="listing-title">${listingTitle}</h2>
                </div>
                <div class="details">
                  <div class="detail-row">
                    <span><strong>Listing:</strong></span>
                    <span>${listingTitle}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Current Bid:</strong></span>
                    <span>$${currentBid.toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Time Remaining:</strong></span>
                    <span>${hoursRemaining} ${hourText}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Status:</strong></span>
                    <span>${isLeadingBidder ? '✅ You\'re winning!' : '⚠️ You\'re not winning'}</span>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${listingUrl}" class="button">View Auction</a>
                </div>
              </div>
              <div class="footer">
                <p>You're receiving this because you have email notifications enabled.</p>
                <p><a href="${appUrl}/account/settings">Manage your notification preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    } else if (notification.type === 'auction_won') {
      const finalBid = notification.metadata?.final_bid || listingData?.current_price || 0
      const sellerName = notification.metadata?.seller_name || 'the seller'

      subject = `🎉 Congratulations! You won "${listingTitle}"`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
              .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
              .content { padding: 20px; background-color: #f9fafb; }
              .listing-preview { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .listing-image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
              .listing-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 0; }
              .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .next-steps { background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png" alt="FrothMonkey" class="logo" />
                <h1>🎉 Congratulations! You Won!</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>Congratulations! You've won the auction and can now arrange delivery or pickup with ${sellerName}.</p>
                <div class="listing-preview">
                  <img src="${listingImage}" alt="${listingTitle}" class="listing-image" />
                  <h2 class="listing-title">${listingTitle}</h2>
                </div>
                <div class="details">
                  <div class="detail-row">
                    <span><strong>Listing:</strong></span>
                    <span>${listingTitle}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Your Winning Bid:</strong></span>
                    <span>$${finalBid.toFixed(2)}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Seller:</strong></span>
                    <span>${sellerName}</span>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${listingUrl}" class="button">Contact Seller</a>
                </div>
                <div class="next-steps">
                  <strong>Next Steps:</strong> Connect with the seller through our messaging system to arrange payment and delivery. Remember to leave a review after the transaction!
                </div>
              </div>
              <div class="footer">
                <p>You're receiving this because you have email notifications enabled.</p>
                <p><a href="${appUrl}/account/settings">Manage your notification preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    } else if (notification.type === 'listing_ended_seller') {
      const finalBid = notification.metadata?.final_bid || 0
      const buyerName = notification.metadata?.buyer_name || 'the buyer'
      const reserveMet = notification.metadata?.reserve_met || false
      const hadBids = notification.metadata?.had_bids || false

      subject = reserveMet ? `🎉 Your auction sold: "${listingTitle}"` : `📊 Your auction ended: "${listingTitle}"`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: ${reserveMet ? '#10b981' : '#6b7280'}; color: white; padding: 20px; text-align: center; }
              .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
              .content { padding: 20px; background-color: #f9fafb; }
              .listing-preview { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
              .listing-image { width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
              .listing-title { font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 0; }
              .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background-color: ${reserveMet ? '#10b981' : '#6b7280'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .next-steps { background-color: ${reserveMet ? '#ecfdf5' : '#f3f4f6'}; padding: 15px; border-left: 4px solid ${reserveMet ? '#10b981' : '#6b7280'}; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png" alt="FrothMonkey" class="logo" />
                <h1>${reserveMet ? '🎉 Your Auction Sold!' : hadBids ? '📊 Your Auction Ended' : '📭 Your Auction Ended'}</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>${reserveMet 
                  ? `Congratulations! Your auction has ended successfully and your item sold to ${buyerName}.`
                  : hadBids
                  ? 'Your auction has ended. The reserve price was not met, but you can review the bids and contact the highest bidder if you wish.'
                  : 'Your auction has ended with no bids.'}</p>
                <div class="listing-preview">
                  <img src="${listingImage}" alt="${listingTitle}" class="listing-image" />
                  <h2 class="listing-title">${listingTitle}</h2>
                </div>
                ${hadBids ? `
                <div class="details">
                  <div class="detail-row">
                    <span><strong>Listing:</strong></span>
                    <span>${listingTitle}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Final Bid:</strong></span>
                    <span>$${finalBid.toFixed(2)}</span>
                  </div>
                  ${reserveMet ? `
                  <div class="detail-row">
                    <span><strong>Highest Bidder:</strong></span>
                    <span>${buyerName}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <span><strong>Status:</strong></span>
                    <span>${reserveMet ? '✅ Sold - Reserve Met' : '⚠️ Reserve Not Met'}</span>
                  </div>
                </div>
                ` : ''}
                <div style="text-align: center;">
                  <a href="${listingUrl}" class="button">View Listing Details</a>
                </div>
                ${reserveMet ? `
                <div class="next-steps">
                  <strong>Next Steps:</strong> You can now exchange contact information with the buyer through our messaging system.
                </div>
                ` : ''}
              </div>
              <div class="footer">
                <p>You're receiving this because you have email notifications enabled.</p>
                <p><a href="${appUrl}/account/settings">Manage your notification preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    // If no email content was generated, return error
    if (!htmlContent || !subject) {
      console.error(`No email template for notification type: ${notification.type}`)
      return new Response(
        JSON.stringify({ error: 'No email template for this notification type', type: notification.type }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'FrothMonkey <updates@frothmonkey.com>',
        to: user.email,
        subject,
        html: htmlContent
      })
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Error from Resend:', resendResult)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Email sent successfully:', resendResult)
    return new Response(
      JSON.stringify({ success: true, messageId: resendResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-notification-emails function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
