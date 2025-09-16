'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface RemoveFromWatchlistButtonProps {
  listingId: string
  userId: string
}

export function RemoveFromWatchlistButton({ listingId, userId }: RemoveFromWatchlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to listing
    e.stopPropagation()
    
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId)

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove item from watchlist',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Item removed from watchlist',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-8 w-8 bg-background/80 hover:bg-background"
      onClick={handleRemove}
      disabled={isLoading}
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
