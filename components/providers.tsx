'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ProfileCompletionReminder } from '@/components/profile-completion-reminder'
import { createClient } from '@/lib/supabase/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [hasUsername, setHasUsername] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        
        // Check if user has a username (profile completed)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        
        setHasUsername(!!profile?.username)
      }
      
      setLoading(false)
    }

    checkProfile()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {!loading && <ProfileCompletionReminder userId={userId} hasUsername={hasUsername} />}
      {children}
    </QueryClientProvider>
  )
}
