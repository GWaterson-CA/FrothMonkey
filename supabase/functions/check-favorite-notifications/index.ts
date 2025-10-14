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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[Favorite Notifications] Starting favorite notifications check...')

    // Call the database function to create favorite notifications
    const { data, error } = await supabase.rpc('create_favorite_notifications')

    if (error) {
      console.error('[Favorite Notifications] Error creating notifications:', error)
      throw error
    }

    const notificationCount = data || 0
    console.log(`[Favorite Notifications] Created ${notificationCount} notifications`)

    // Now fetch the created notifications and send emails
    if (notificationCount > 0) {
      // Get notifications that were just created and need emails
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!notifications_user_id_fkey (
            id,
            username,
            full_name,
            notification_preferences
          )
        `)
        .in('type', ['favorite_reserve_met', 'favorite_ending_soon'])
        .is('read_at', null)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false })

      if (notifError) {
        console.error('[Favorite Notifications] Error fetching notifications:', notifError)
      } else if (notifications && notifications.length > 0) {
        console.log(`[Favorite Notifications] Processing ${notifications.length} notifications for email...`)

        let emailsSent = 0
        
        for (const notification of notifications) {
          const profile = notification.profiles
          if (!profile) continue

          // Check if user has email notifications enabled
          const prefs = profile.notification_preferences || {}
          if (!prefs.email_notifications || prefs.favorite_notifications === false) {
            console.log(`[Favorite Notifications] User ${profile.username} has email disabled, skipping`)
            continue
          }

          // Get user's email
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (!authUser?.user?.email) {
            console.log(`[Favorite Notifications] No email for user ${profile.username}, skipping`)
            continue
          }

          const metadata = notification.metadata as any
          
          // Calculate time remaining for reserve met notifications
          let timeRemaining = ''
          if (notification.type === 'favorite_reserve_met' && metadata.end_time) {
            const endTime = new Date(metadata.end_time)
            const now = new Date()
            const diff = endTime.getTime() - now.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            
            if (hours > 24) {
              const days = Math.floor(hours / 24)
              timeRemaining = `${days} day${days > 1 ? 's' : ''}`
            } else if (hours > 0) {
              timeRemaining = `${hours}h ${minutes}m`
            } else {
              timeRemaining = `${minutes} minutes`
            }
          }

          // Send email notification via API
          try {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                recipientEmail: authUser.user.email,
                recipientName: profile.full_name || profile.username || 'there',
                notificationType: notification.type,
                data: {
                  listingTitle: metadata.listing_title,
                  listingId: notification.listing_id,
                  currentBid: metadata.current_price,
                  timeRemaining: timeRemaining,
                  reserveMet: metadata.reserve_met,
                }
              })
            })

            if (emailResponse.ok) {
              emailsSent++
              console.log(`[Favorite Notifications] Sent ${notification.type} email to ${authUser.user.email}`)
            } else {
              console.error(`[Favorite Notifications] Failed to send email to ${authUser.user.email}:`, await emailResponse.text())
            }
          } catch (emailError) {
            console.error(`[Favorite Notifications] Error sending email:`, emailError)
          }
        }

        console.log(`[Favorite Notifications] Sent ${emailsSent} emails`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notificationCount,
        message: `Created ${notificationCount} favorite notifications`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('[Favorite Notifications] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

