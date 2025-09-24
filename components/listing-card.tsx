'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Clock, Gavel, MapPin } from 'lucide-react'
import { formatCurrency, formatRelativeTime, isAuctionEndingSoon, getImageUrl, getEffectiveAuctionStatus, isAuctionEffectivelyLive } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'

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
  }
  listingUrl?: string
}

export function ListingCard({ listing, listingUrl }: ListingCardProps) {
  const effectiveStatus = getEffectiveAuctionStatus(listing.status, listing.start_time, listing.end_time)
  const isEndingSoon = isAuctionEndingSoon(listing.end_time)
  const hasImage = listing.cover_image_url
  const imageUrl = hasImage ? getImageUrl(listing.cover_image_url) : '/placeholder-image.jpg'
  
  // Use the provided URL or fall back to the old format
  const href = listingUrl || `/listing/${listing.id}`

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <Link href={href}>
        <div className="aspect-square relative overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {effectiveStatus === 'live' && (
              <Badge variant="success" className="text-xs">
                Live
              </Badge>
            )}
            {effectiveStatus === 'ended' && (
              <Badge variant="secondary" className="text-xs">
                Ended
              </Badge>
            )}
            {effectiveStatus === 'sold' && (
              <Badge variant="default" className="text-xs">
                Sold
              </Badge>
            )}
            {listing.reserve_met && (
              <Badge variant="secondary" className="text-xs">
                Reserve Met
              </Badge>
            )}
            {listing.buy_now_enabled && (
              <Badge variant="outline" className="text-xs bg-background/80">
                Buy Now
              </Badge>
            )}
            {isEndingSoon && effectiveStatus === 'live' && (
              <Badge variant="destructive" className="text-xs pulse-red">
                Ending Soon
              </Badge>
            )}
          </div>

          {/* Watchlist button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.preventDefault()
              // TODO: Add to watchlist functionality
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={href}>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>
        
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current bid</span>
            <span className="font-semibold">
              {formatCurrency(listing.current_price || listing.start_price)}
            </span>
          </div>
          
          {listing.buy_now_price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Buy now</span>
              <span className="font-semibold text-primary">
                {formatCurrency(listing.buy_now_price)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {listing.status === 'live' ? (
            <CountdownTimer endTime={listing.end_time} />
          ) : (
            <span>Ended {formatRelativeTime(listing.end_time)}</span>
          )}
        </div>

        {listing.categories && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {listing.categories.name}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span>@{listing.profiles?.username || 'Unknown'}</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{listing.location}</span>
            </div>
          </div>
          {effectiveStatus === 'live' && (
            <div className="flex items-center gap-1">
              <Gavel className="h-3 w-3" />
              <span>Bid now</span>
            </div>
          )}
          {effectiveStatus === 'ended' && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Auction ended</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
