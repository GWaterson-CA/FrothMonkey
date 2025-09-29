import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Eye, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { formatCurrency, isAuctionEnded, isAuctionEndingSoon } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'
import { RemoveFromWatchlistButton } from '@/components/account/remove-from-watchlist-button'

async function WatchlistContent() {
  const profile = await getUserProfile()
  const supabase = createClient()

  if (!profile) {
    return <div>Profile not found</div>
  }

  // Fetch user's watchlist with listing information
  const { data: watchlistItems, error } = await supabase
    .from('watchlists')
    .select(`
      *,
      listings!watchlists_listing_id_fkey (
        id,
        title,
        status,
        current_price,
        start_price,
        end_time,
        cover_image_url,
        reserve_met,
        buy_now_enabled,
        buy_now_price,
        categories (
          name
        ),
        profiles!listings_owner_id_fkey (
          username
        )
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching watchlist:', error)
    return <div>Error loading watchlist</div>
  }

  if (!watchlistItems || watchlistItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Your watchlist is empty</p>
            <p className="text-sm mb-4">
              Add items to your watchlist to keep track of auctions you're interested in
            </p>
            <Button asChild>
              <Link href="/">Browse Auctions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {watchlistItems.map((item) => {
        const listing = item.listings
        const hasEnded = isAuctionEnded(listing.end_time)
        const isActuallyLive = listing.status === 'live' && !hasEnded
        const isEndingSoon = isAuctionEndingSoon(listing.end_time) && isActuallyLive

        return (
          <Card key={item.listing_id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Image placeholder */}
              <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-4xl opacity-50">📷</div>
                
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
                  {!isActuallyLive && listing.status !== 'live' && (
                    <Badge variant="secondary" className="text-xs">
                      {listing.status}
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
                  {isEndingSoon && (
                    <Badge variant="destructive" className="text-xs">
                      Ending Soon
                    </Badge>
                  )}
                </div>

                {/* Remove from watchlist button */}
                <div className="absolute top-2 right-2">
                  <RemoveFromWatchlistButton 
                    listingId={listing.id}
                    userId={profile.id}
                  />
                </div>
              </div>

              <div className="p-4">
                <Link href={`/listing/${listing.id}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                    {listing.title}
                  </h3>
                </Link>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current bid:</span>
                    <span className="font-semibold">
                      {formatCurrency(listing.current_price || listing.start_price)}
                    </span>
                  </div>

                  {listing.buy_now_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy now:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(listing.buy_now_price)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{listing.categories?.name || 'Unknown'}</span>
                  </div>

                  {isActuallyLive ? (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time left:</span>
                      <CountdownTimer endTime={listing.end_time} />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <span>Ended</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller:</span>
                    <span>@{listing.profiles?.username || 'Unknown'}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/listing/${listing.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  
                  {isActuallyLive && (
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/listing/${listing.id}#bid-form`}>
                        Bid Now
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Watchlist</h1>
        <p className="text-muted-foreground">
          Keep track of auctions you're interested in bidding on.
        </p>
      </div>

      <Suspense fallback={<div>Loading watchlist...</div>}>
        <WatchlistContent />
      </Suspense>
    </div>
  )
}
