// Supabase Edge Function to send notification emails
// This function should be triggered by database webhooks when new notifications are created

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
    const appUrl = Deno.env.get('APP_URL') || 'https://frothmonkey.com'
    
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

    // Build email data based on notification type
    let emailData: any = {
      listingId: notification.listing_id,
      listingTitle: listingData?.title || 'Unknown Listing'
    }

    if (notification.type === 'bid_outbid') {
      emailData.previousBid = notification.metadata?.previous_bid || 0
      emailData.newBid = notification.metadata?.new_bid || 0
    } else if (notification.type.startsWith('time_warning_')) {
      emailData.currentBid = listingData?.current_price || 0
      emailData.isLeadingBidder = notification.metadata?.is_leading_bidder || false
    } else if (notification.type === 'listing_ended_seller') {
      emailData.finalBid = notification.metadata?.final_bid || 0
      emailData.buyerName = notification.metadata?.buyer_name || 'Unknown'
      emailData.reserveMet = notification.metadata?.reserve_met || false
      emailData.hadBids = notification.metadata?.had_bids || false
    } else if (notification.type === 'auction_won') {
      emailData.finalBid = notification.metadata?.final_bid || 0
      emailData.sellerName = notification.metadata?.seller_name || 'The seller'
    }

    // Call the Next.js API to send the email
    const response = await fetch(`${appUrl}/api/email/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: notification.user_id,
        notificationType: notification.type,
        notificationData: emailData
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error sending email:', result)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', result)
    return new Response(
      JSON.stringify({ success: true, result }),
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

