'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Clock } from 'lucide-react'
import { formatCurrency, isAuctionEndingSoon, isAuctionEnded, getImageUrl, formatTimeRemaining } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    location: string
    current_price: number
    start_price: number
    reserve_price: number | null
    buy_now_price: number | null
    end_time: string
    status: string
    cover_image_url: string | null
    reserve_met: boolean | null
    buy_now_enabled: boolean | null
    categories: {
      name: string
      slug: string
    } | null
    profiles: {
      username: string | null
    } | null
    bid_count?: number
  }
  initialIsFavorited?: boolean
  initialFavoriteCount?: number
  currentUserId?: string | null
}

export function ListingCard({ listing, initialIsFavorited = false, initialFavoriteCount = 0, currentUserId }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isEndingSoon = isAuctionEndingSoon(listing.end_time)
  const hasEnded = isAuctionEnded(listing.end_time)
  const isActuallyLive = listing.status === 'live' && !hasEnded
  const hasImage = listing.cover_image_url
  const imageUrl = hasImage ? getImageUrl(listing.cover_image_url) : '/placeholder-image.jpg'

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (isLoading) return
    setIsLoading(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', currentUserId)
          .eq('listing_id', listing.id)

        if (!error) {
          setIsFavorited(false)
          setFavoriteCount(Math.max(0, favoriteCount - 1))
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('watchlists')
          .insert({
            user_id: currentUserId,
            listing_id: listing.id
          })

        if (!error) {
          setIsFavorited(true)
          setFavoriteCount(favoriteCount + 1)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-200">
      <Link href={`/listing/${listing.id}`}>
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-contain transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isActuallyLive && (
              <Badge variant="success" className="text-xs">
                Live
              </Badge>
            )}
            {hasEnded && listing.status === 'live' && (
              <Badge variant="secondary" className="text-xs">
                Auction ended
              </Badge>
            )}
            {listing.reserve_met && (
              <Badge variant="secondary" className="text-xs">
                Reserve Met
              </Badge>
            )}
          </div>

          {/* Favorite button with count */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/95 hover:bg-background transition-colors rounded-full text-red-500 hover:text-red-600"
            onClick={handleFavoriteClick}
            disabled={isLoading}
          >
            <div className="relative">
              <Heart 
                className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} 
              />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {favoriteCount}
                </span>
              )}
            </div>
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-3">
            {listing.title}
          </h3>
        </Link>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground">
              {hasEnded ? 'Final price:' : 'Current bid:'}
            </span>
            <span className="font-semibold text-lg">
              {formatCurrency(listing.current_price || listing.start_price)}
            </span>
          </div>

          {/* Place Bid Button - Only show for live auctions */}
          {isActuallyLive && (
            <Link href={`/listing/${listing.id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-lg transition-all duration-200">
                Place Bid
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{listing.location}</span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {isActuallyLive ? (
              <>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Listing ends in {formatTimeRemaining(listing.end_time)}</span>
              </>
            ) : hasEnded && listing.bid_count !== undefined ? (
              <div className="space-y-1">
                <div className="font-medium text-foreground">
                  {listing.bid_count === 0 
                    ? 'No bids placed' 
                    : listing.bid_count === 1 
                    ? '1 bid placed' 
                    : `${listing.bid_count} bids placed`}
                </div>
                {listing.bid_count > 0 && (
                  <div className="text-muted-foreground">Sold for {formatCurrency(listing.current_price || listing.start_price)}</div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Listing ended</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
