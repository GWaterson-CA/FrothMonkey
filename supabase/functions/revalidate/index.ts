import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RevalidateRequest {
  tags?: string[]
  paths?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tags = [], paths = [] }: RevalidateRequest = await req.json()
    
    const siteUrl = Deno.env.get('SITE_URL')
    const revalidateSecret = Deno.env.get('REVALIDATE_SECRET')

    if (!siteUrl || !revalidateSecret) {
      throw new Error('Missing SITE_URL or REVALIDATE_SECRET environment variables')
    }

    const revalidateUrl = `${siteUrl}/api/revalidate`
    
    console.log(`Triggering revalidation for tags: ${tags.join(', ')}, paths: ${paths.join(', ')}`)

    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${revalidateSecret}`
      },
      body: JSON.stringify({ tags, paths })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Revalidation failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('Revalidation successful:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
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
    console.error('Revalidation function error:', error)
    
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
