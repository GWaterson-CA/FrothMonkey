import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export const getUser = cache(async () => {
  const supabase = createClient()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error:', error)
    return null
  }
})

export const getUserProfile = cache(async (): Promise<{
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
} | null> => {
  const user = await getUser()
  if (!user) return null

  // Use service client to avoid RLS recursion issues during development
  const supabase = createClient()
  
  try {
    // Simple query without complex joins to avoid recursion
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_admin, created_at')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      console.error('Error fetching profile:', error)
      return null
    }

    return profile as {
      id: string;
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      is_admin: boolean | null;
      created_at: string | null;
    } | null
  } catch (error) {
    console.error('Error:', error)
    return null
  }
})

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

export async function requireProfile(): Promise<{
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  created_at: string | null;
}> {
  const profile = await getUserProfile()
  if (!profile) {
    redirect('/auth/setup-profile')
  }
  return profile
}

export async function requireAdmin() {
  const profile = await requireProfile()
  if (!profile.is_admin) {
    redirect('/')
  }
  return profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.is_admin === true
}
