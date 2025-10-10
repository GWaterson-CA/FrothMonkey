// Supabase Edge Function to send notification emails
// This function is triggered by database webhooks when new notifications are created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        .select('id, title, current_price')
        .eq('id', notification.listing_id)
        .single()
      
      listingData = data
    }

    const recipientName = profile?.full_name || profile?.username || 'User'
    const listingTitle = listingData?.title || 'Unknown Listing'
    const listingUrl = `${appUrl}/listing/${notification.listing_id}`

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
              .content { padding: 20px; background-color: #f9fafb; }
              .details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>😔 You've Been Outbid!</h1>
              </div>
              <div class="content">
                <p>Hi ${recipientName},</p>
                <p>Someone has placed a higher bid on an auction you were winning. Don't let it slip away!</p>
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
