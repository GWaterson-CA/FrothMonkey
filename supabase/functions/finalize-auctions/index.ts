import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting auction finalization process...')

    // Call the finalize_auctions SQL function
    const { data, error } = await supabase.rpc('finalize_auctions', {
      batch_limit: 200
    })

    if (error) {
      console.error('Error finalizing auctions:', error)
      throw error
    }

    const finalizedCount = data as number
    console.log(`Successfully finalized ${finalizedCount} auctions`)

    // If auctions were finalized, trigger revalidation of relevant pages
    if (finalizedCount > 0) {
      const revalidateUrl = `${Deno.env.get('SITE_URL')}/api/revalidate`
      const revalidateSecret = Deno.env.get('REVALIDATE_SECRET')

      if (revalidateUrl && revalidateSecret) {
        try {
          const revalidateResponse = await fetch(revalidateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${revalidateSecret}`
            },
            body: JSON.stringify({
              tags: ['listings', 'auctions']
            })
          })

          if (revalidateResponse.ok) {
            console.log('Successfully triggered page revalidation')
          } else {
            console.warn('Failed to trigger page revalidation:', await revalidateResponse.text())
          }
        } catch (revalidateError) {
          console.warn('Error triggering revalidation:', revalidateError)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        finalizedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})
