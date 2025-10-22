import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', data.user.id)
        .single()

      // If profile doesn't exist or is incomplete, redirect to setup-profile
      if (!profile || !profile.username || !profile.full_name) {
        return NextResponse.redirect(
          new URL(`/auth/setup-profile?redirect=${encodeURIComponent(redirect)}`, requestUrl.origin)
        )
      }

      // Profile exists and is complete, redirect to intended destination
      return NextResponse.redirect(new URL(redirect, requestUrl.origin))
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(
    new URL('/auth/login?error=authentication_failed', requestUrl.origin)
  )
}

