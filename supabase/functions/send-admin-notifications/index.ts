// Supabase Edge Function to send admin notifications
// This function is triggered by database webhooks when new users or listings are created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin email to receive notifications
const ADMIN_EMAIL = 'frothmonkey@myyahoo.com'

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

    // Get the data from the request
    const { type, record } = await req.json()
    
    if (!type || !record) {
      return new Response(
        JSON.stringify({ error: 'Missing type or record in request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Admin Notification] Processing ${type} notification`)

    let subject = ''
    let htmlContent = ''

    if (type === 'new_user') {
      // Get user auth data
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(record.id)
      
      if (authError || !user) {
        console.error('Error fetching user:', authError)
        return new Response(
          JSON.stringify({ error: 'User not found', details: authError }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const username = record.username || 'Not set'
      const fullName = record.full_name || 'Not provided'
      const email = user.email || 'Not available'
      const createdAt = new Date(record.created_at).toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'short',
        timeZone: 'America/Los_Angeles'
      })

      subject = `🎉 New User Registered: ${username}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 15px;
              }
              .content {
                background-color: #f9fafb;
                padding: 30px 20px;
                border-radius: 0 0 8px 8px;
              }
              .info-card {
                background-color: white;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-weight: bold;
                color: #4b5563;
              }
              .info-value {
                color: #1f2937;
                text-align: right;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-size: 13px;
              }
              .badge {
                display: inline-block;
                background-color: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img
                  src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png"
                  alt="FrothMonkey"
                  class="logo"
                />
                <h1 style="margin: 0;">🎉 New User Registration</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">A new user has just joined FrothMonkey!</p>
              </div>
              <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span class="badge">New Registration</span>
                </div>
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">Username:</span>
                    <span class="info-value">${username}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${fullName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Email Address:</span>
                    <span class="info-value">${email}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Registration Date:</span>
                    <span class="info-value">${createdAt}</span>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${appUrl}/admin/users" class="button">View User in Admin Panel</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated admin notification from FrothMonkey</p>
                <p style="margin: 5px 0;">FrothMonkey - Local Auction Marketplace</p>
              </div>
            </div>
          </body>
        </html>
      `
    } else if (type === 'new_listing') {
      // Get listing owner information
      const { data: owner } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', record.owner_id)
        .single()

      const username = owner?.username || 'Unknown'
      const title = record.title || 'Untitled Listing'
      const description = record.description || 'No description provided'
      const listingUrl = `${appUrl}/listing/${record.id}`
      const createdAt = new Date(record.created_at).toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'short',
        timeZone: 'America/Los_Angeles'
      })
      const startPrice = parseFloat(record.start_price || 0).toFixed(2)
      const reservePrice = record.reserve_price ? parseFloat(record.reserve_price).toFixed(2) : 'None'
      const buyNowPrice = record.buy_now_price ? parseFloat(record.buy_now_price).toFixed(2) : 'Not available'
      
      // Get email-safe image URL
      let coverImage = `${appUrl}/placeholder-image.jpg`
      if (record.cover_image_url) {
        if (record.cover_image_url.startsWith('http')) {
          coverImage = record.cover_image_url
        } else if (record.cover_image_url.includes('/storage/v1/object/public/')) {
          coverImage = record.cover_image_url.startsWith('/') 
            ? `${supabaseUrl}${record.cover_image_url}` 
            : `${supabaseUrl}/${record.cover_image_url}`
        } else {
          const cleanPath = record.cover_image_url.startsWith('/') 
            ? record.cover_image_url.slice(1) 
            : record.cover_image_url
          coverImage = `${supabaseUrl}/storage/v1/object/public/listing-images/${cleanPath}`
        }
      }

      subject = `📦 New Listing Created: ${title}`
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 15px;
              }
              .content {
                background-color: #f9fafb;
                padding: 30px 20px;
                border-radius: 0 0 8px 8px;
              }
              .listing-preview {
                background-color: white;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .listing-image {
                width: 100%;
                max-width: 400px;
                height: auto;
                border-radius: 8px;
                margin-bottom: 15px;
                display: block;
                margin-left: auto;
                margin-right: auto;
              }
              .listing-title {
                font-size: 22px;
                font-weight: bold;
                color: #1a1a1a;
                margin: 15px 0;
              }
              .listing-description {
                color: #4b5563;
                padding: 15px;
                background-color: #f9fafb;
                border-radius: 6px;
                margin: 15px 0;
                text-align: left;
                border-left: 4px solid #3b82f6;
              }
              .info-card {
                background-color: white;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                font-weight: bold;
                color: #4b5563;
              }
              .info-value {
                color: #1f2937;
                text-align: right;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-size: 13px;
              }
              .badge {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img
                  src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png"
                  alt="FrothMonkey"
                  class="logo"
                />
                <h1 style="margin: 0;">📦 New Listing Created</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">A new listing has been added to FrothMonkey!</p>
              </div>
              <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span class="badge">New Listing</span>
                </div>
                <div class="listing-preview">
                  <img
                    src="${coverImage}"
                    alt="${title}"
                    class="listing-image"
                    onerror="this.src='${appUrl}/placeholder-image.jpg'"
                  />
                  <h2 class="listing-title">${title}</h2>
                  <div class="listing-description">
                    <strong>Description:</strong><br/>
                    ${description}
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-row">
                    <span class="info-label">Listed by:</span>
                    <span class="info-value">${username}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Start Price:</span>
                    <span class="info-value">$${startPrice}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Reserve Price:</span>
                    <span class="info-value">${reservePrice === 'None' ? 'None' : '$' + reservePrice}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Buy Now Price:</span>
                    <span class="info-value">${buyNowPrice === 'Not available' ? 'Not available' : '$' + buyNowPrice}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value" style="text-transform: capitalize;">${record.status}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${createdAt}</span>
                  </div>
                </div>
                <div style="text-align: center;">
                  <a href="${listingUrl}" class="button">View Listing</a>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated admin notification from FrothMonkey</p>
                <p style="margin: 5px 0;">FrothMonkey - Local Auction Marketplace</p>
              </div>
            </div>
          </body>
        </html>
      `
    } else {
      console.error(`Unknown notification type: ${type}`)
      return new Response(
        JSON.stringify({ error: 'Unknown notification type', type }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    console.log(`[Admin Notification] Sending email to ${ADMIN_EMAIL}`)
    console.log(`[Admin Notification] Subject: ${subject}`)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'FrothMonkey <updates@frothmonkey.com>',
        to: ADMIN_EMAIL,
        subject,
        html: htmlContent
      })
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('[Admin Notification] Error from Resend:', resendResult)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: resendResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Admin Notification] ✅ Email sent successfully:', resendResult)
    return new Response(
      JSON.stringify({ success: true, messageId: resendResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Admin Notification] Error in function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

