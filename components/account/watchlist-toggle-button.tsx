'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

interface WatchlistToggleButtonProps {
  listingId: string
  userId?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
}

export function WatchlistToggleButton({ 
  listingId, 
  userId, 
  size = 'sm', 
  variant = 'outline' 
}: WatchlistToggleButtonProps) {
  const [isWatched, setIsWatched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Check if listing is already in watchlist
  useEffect(() => {
    async function checkWatchlistStatus() {
      if (!userId) {
        setIsCheckingStatus(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('watchlists')
          .select('listing_id')
          .eq('user_id', userId)
          .eq('listing_id', listingId)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking watchlist status:', error)
        } else {
          setIsWatched(!!data)
        }
      } catch (error) {
        console.error('Error checking watchlist status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkWatchlistStatus()
  }, [listingId, userId, supabase])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your watchlist',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      if (isWatched) {
        // Remove from watchlist
        const { error } = await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId)

        if (error) {
          throw error
        }

        setIsWatched(false)
        toast({
          title: 'Removed from watchlist',
          description: 'Item removed from your watchlist',
        })
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('watchlists')
          .insert({
            user_id: userId,
            listing_id: listingId,
          })

        if (error) {
          throw error
        }

        setIsWatched(true)
        toast({
          title: 'Added to watchlist',
          description: 'Item added to your watchlist',
        })
      }

      router.refresh()
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <Button variant={variant} size={size} disabled>
        <Heart className="h-4 w-4 mr-2" />
        Watch
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart 
        className={`h-4 w-4 mr-2 ${isWatched ? 'fill-current text-red-500' : ''}`} 
      />
      {isWatched ? 'Watching' : 'Watch'}
    </Button>
  )
}
