import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { formatCurrency, formatDateTime, getImageUrl } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'
import { BidHistory } from '@/components/bid-history'
import { BidForm } from '@/components/bid-form'
import { ListingImages } from '@/components/listing-images'

interface ListingPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description')
    .eq('id', params.id)
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found | FrothMonkey',
    }
  }

  return {
    title: `${listing.title} | FrothMonkey`,
    description: listing.description || `Auction for ${listing.title}`,
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const supabase = createClient()
  const profile = await getUserProfile()

  // Fetch listing with related data
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      categories (
        name,
        slug
      ),
      profiles!listings_owner_id_fkey (
        username,
        full_name,
        avatar_url
      ),
      listing_images (
        id,
        path,
        sort_order
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // Check if user can view this listing
  const canView = listing.status !== 'draft' || listing.owner_id === profile?.id

  if (!canView) {
    notFound()
  }

  // Fetch recent bids
  const { data: bids } = await supabase
    .from('bids')
    .select(`
      *,
      profiles!bids_bidder_id_fkey (
        username
      )
    `)
    .eq('listing_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const isOwner = profile?.id === listing.owner_id
  const canBid = profile && !isOwner && listing.status === 'live'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <ListingImages 
                images={listing.listing_images || []}
                coverImage={listing.cover_image_url}
                title={listing.title}
              />

              {/* Title and Category */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {listing.categories && (
                      <Badge variant="outline">{listing.categories.name}</Badge>
                    )}
                    <Badge 
                      variant={listing.status === 'live' ? 'success' : 'secondary'}
                    >
                      {listing.status}
                    </Badge>
                    {listing.reserve_met && (
                      <Badge variant="secondary">Reserve Met</Badge>
                    )}
                    {listing.buy_now_enabled && (
                      <Badge variant="outline">Buy Now Available</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold">{listing.title}</h1>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Watch
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap">
                      {listing.description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bid History */}
              <BidHistory 
                listingId={listing.id} 
                initialBids={bids || []} 
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Price */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Bid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(listing.current_price || listing.start_price)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Starting bid:</span>
                      <span>{formatCurrency(listing.start_price)}</span>
                    </div>
                    {listing.reserve_price && (
                      <div className="flex justify-between">
                        <span>Reserve price:</span>
                        <span>
                          {listing.reserve_met ? 
                            formatCurrency(listing.reserve_price) : 
                            'Not disclosed'
                          }
                        </span>
                      </div>
                    )}
                    {listing.buy_now_price && (
                      <div className="flex justify-between">
                        <span>Buy now price:</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(listing.buy_now_price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {listing.status === 'live' && (
                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-2">
                        Time remaining:
                      </div>
                      <CountdownTimer endTime={listing.end_time} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bidding Form */}
              {canBid && (
                <BidForm 
                  listingId={listing.id}
                  currentPrice={listing.current_price || listing.start_price}
                  buyNowPrice={listing.buy_now_price}
                />
              )}

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {listing.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {listing.profiles?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{listing.profiles?.username || 'unknown'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className="capitalize">{listing.condition.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Listed:</span>
                    <span>{formatDateTime(listing.created_at!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ends:</span>
                    <span>{formatDateTime(listing.end_time)}</span>
                  </div>
                  {listing.anti_sniping_seconds > 0 && (
                    <div className="flex justify-between">
                      <span>Anti-sniping:</span>
                      <span>{listing.anti_sniping_seconds}s extension</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
