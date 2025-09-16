'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface ShareButtonProps {
  listingId: string
  title?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
}

export function ShareButton({ 
  listingId, 
  title, 
  size = 'sm', 
  variant = 'outline' 
}: ShareButtonProps) {
  const [isShared, setIsShared] = useState(false)
  const { toast } = useToast()

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}/listing/${listingId}`
    const shareData = {
      title: title ? `${title} - FrothMonkey` : 'Check out this auction on FrothMonkey',
      text: 'Check out this auction listing',
      url: url,
    }

    try {
      // Try using native Web Share API first (mobile devices)
      if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
        toast({
          title: 'Shared successfully',
          description: 'Listing shared successfully',
        })
        return
      }

      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(url)
      setIsShared(true)
      
      toast({
        title: 'Link copied',
        description: 'Listing link copied to clipboard',
      })

      // Reset the icon after 2 seconds
      setTimeout(() => setIsShared(false), 2000)

    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to share listing',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
    >
      {isShared ? (
        <Check className="h-4 w-4 mr-2 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4 mr-2" />
      )}
      Share
    </Button>
  )
}
