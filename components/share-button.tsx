'use client'

import { useState } from 'react'
import { Share2, Check, Copy, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ShareButtonProps {
  listingId: string
  title?: string
  listingUrl?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
}

export function ShareButton({ 
  listingId, 
  title, 
  listingUrl,
  size = 'sm', 
  variant = 'outline' 
}: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  // Generate A/B CTA variant (deterministic based on listing ID)
  const ctaVariants = [
    'Bid now before it\'s too late!',
    'Don\'t miss out on this auction!',
    'Place your bid today!',
    'Join the bidding now!'
  ]
  const ctaIndex = parseInt(listingId.slice(-1), 16) % ctaVariants.length
  const ctaText = ctaVariants[ctaIndex]

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://frothmonkey.com'
  const finalListingUrl = listingUrl || `${baseUrl}/listing/${listingId}`
  const shareTitle = title ? `${title} - FrothMonkey` : 'Check out this auction on FrothMonkey'
  const shareText = `Check out this auction: ${title || 'Amazing item'} on FrothMonkey! ${ctaText}`
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(finalListingUrl)
      setIsCopied(true)
      
      // Track share event
      trackShareEvent('copy', listingId)
      
      toast({
        title: 'Link copied',
        description: 'Listing link copied to clipboard',
      })

      // Reset the icon after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const handleNativeShare = async () => {
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: finalListingUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        trackShareEvent('native', listingId)
        toast({
          title: 'Shared successfully',
          description: 'Listing shared successfully',
        })
      } else {
        // Fallback to copy if native share not available
        await handleCopyLink()
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Don't show error if user cancelled
      if (error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: 'Failed to share listing',
          variant: 'destructive',
        })
      }
    }
  }

  const handlePlatformShare = (platform: string) => {
    let shareUrl = ''
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalListingUrl)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(finalListingUrl)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalListingUrl)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${finalListingUrl}`)}`
        break
    }

    if (shareUrl) {
      trackShareEvent(platform, listingId)
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  const trackShareEvent = async (platform: string, listingId: string) => {
    try {
      await fetch('/api/analytics/share-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          listingId,
          timestamp: new Date().toISOString(),
        })
      })
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.debug('Share event tracking failed:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          {isCopied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        
        {/* Native share for mobile */}
        {typeof window !== 'undefined' && navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => handlePlatformShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePlatformShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePlatformShare('linkedin')}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handlePlatformShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
