import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingCircles } from '@/components/floating-circles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getUser } from '@/lib/auth'
import { formatCurrency, formatDateTime, getImageUrl, isAuctionEnded } from '@/lib/utils'
import { BidHistory } from '@/components/bid-history'
import { ListingImages } from '@/components/listing-images'
import { AuctionQuestions } from '@/components/auction-questions'
import { UserRatingDisplay } from '@/components/reviews/star-rating'
import { WatchlistToggleButton } from '@/components/account/watchlist-toggle-button'
import { ShareButton } from '@/components/share-button'
import { ReportButton } from '@/components/report-button'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { CombinedBiddingCard } from '@/components/combined-bidding-card'
import { ViewsAndShare } from '@/components/views-and-share'

// Helper function to format payment method labels
function formatPaymentMethod(method: string): string {
  const methodLabels: Record<string, string> = {
    'cash': 'Cash',
    'crypto': 'Cryptocurrency',
    'e-transfer': 'E-Transfer',
    'cheque': 'Cheque',
    'wire': 'Wire Transfer',
    'bank_draft': 'Bank Draft',
  }
  return methodLabels[method] || method
}

interface ListingPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      title, 
      description, 
      current_price, 
      start_price, 
      end_time, 
      status, 
      cover_image_url,
      location,
      categories (
        name,
        slug
      ),
      profiles!listings_owner_id_fkey (
        username
      )
    `)
    .eq('id', params.id)
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found | FrothMonkey',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.frothmonkey.com'
  const listingUrl = `${baseUrl}/listing/${params.id}`
  
  // Use direct Supabase storage URL for better Facebook compatibility
  // Facebook's crawler prefers static, directly accessible images over dynamic generation
  let ogImageUrl = `${baseUrl}/FrothMonkey Logo Blue.png` // Fallback to logo
  if (listing.cover_image_url) {
    if (listing.cover_image_url.startsWith('http')) {
      ogImageUrl = listing.cover_image_url
    } else {
      // Construct full Supabase storage URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysoxcftclnlmvxuopdun.supabase.co'
      ogImageUrl = `${supabaseUrl}/storage/v1/object/public/listing-images/${listing.cover_image_url}`
    }
  }
  
  // Generate A/B CTA variant (deterministic based on listing ID)
  const ctaVariants = [
    'Bid now before it\'s too late!',
    'Don\'t miss out on this auction!',
    'Place your bid today!',
    'Join the bidding now!'
  ]
  const ctaIndex = parseInt(params.id.slice(-1), 16) % ctaVariants.length
  const ctaText = ctaVariants[ctaIndex]
  
  const currentPrice = listing.current_price || listing.start_price
  const priceText = currentPrice > 0 ? `Current bid: $${currentPrice.toLocaleString()}` : `Starting at $${listing.start_price.toLocaleString()}`
  
  const description = listing.description 
    ? `${listing.description.substring(0, 120)}... ${ctaText}`
    : `Auction for ${listing.title} in ${listing.location}. ${priceText}. ${ctaText}`

  return {
    title: `${listing.title} | FrothMonkey`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: `${listing.title} | FrothMonkey`,
      description,
      url: listingUrl,
      siteName: 'FrothMonkey',
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
          type: 'image/jpeg',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} | FrothMonkey`,
      description,
      images: [ogImageUrl],
      creator: '@frothmonkey',
      site: '@frothmonkey',
    },
    alternates: {
      canonical: listingUrl,
    },
    other: {
      // Facebook-specific tags
      // 'fb:app_id': 'YOUR_APP_ID', // Uncomment and add your Facebook App ID for advanced features
      
      // App Links for mobile - helps open in Facebook app
      'al:web:url': listingUrl,
      'al:ios:url': listingUrl,
      'al:ios:app_name': 'FrothMonkey',
      'al:android:url': listingUrl,
      'al:android:app_name': 'FrothMonkey',
      
      // Custom auction metadata
      'auction:current_price': currentPrice.toString(),
      'auction:start_price': listing.start_price.toString(),
      'auction:end_time': listing.end_time,
      'auction:status': listing.status,
      'auction:location': listing.location,
      'auction:category': listing.categories?.name || '',
    },
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const supabase = createClient()
  const user = await getUser()
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
        avatar_url,
        payment_preferences
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

  // Fetch recent bids - ordered by amount (highest first), then by created_at (earliest first for ties)
  const { data: bids } = await supabase
    .from('bids')
    .select(`
      *,
      profiles!bids_bidder_id_fkey (
        username
      )
    `)
    .eq('listing_id', params.id)
    .order('amount', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(20)

  const isOwner = profile?.id === listing.owner_id
  const hasEnded = isAuctionEnded(listing.end_time)
  const isActuallyLive = listing.status === 'live' && !hasEnded
  const canBid = profile && !isOwner && isActuallyLive

  // Fetch seller rating
  let sellerRating = null
  if (listing.owner_id) {
    const { data: ratingData } = await supabase
      .rpc('get_user_rating', { user_uuid: listing.owner_id })
    
    if (ratingData) {
      sellerRating = ratingData
    }
  }

  // Fetch listing view count
  const { data: viewCountData } = await supabase
    .rpc('get_listing_view_count', { listing_uuid: params.id })
  
  const viewCount = viewCountData || 0

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating circles background */}
      <FloatingCircles />
      
      <AnalyticsTracker listingId={listing.id} />
      <Header />
      
      <main className="flex-1 relative z-10">
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <ListingImages 
                images={listing.listing_images || []}
                coverImage={listing.cover_image_url}
                title={listing.title}
              />

              {/* Title and Badges */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {listing.categories && (
                    <Badge variant="outline">{listing.categories.name}</Badge>
                  )}
                  {isActuallyLive && (
                    <Badge variant="success">
                      Live
                    </Badge>
                  )}
                  {hasEnded && listing.status === 'live' && (
                    <Badge variant="secondary">
                      Auction ended
                    </Badge>
                  )}
                  {!isActuallyLive && listing.status !== 'live' && (
                    <Badge variant="secondary">
                      {listing.status}
                    </Badge>
                  )}
                  {listing.reserve_met && (
                    <Badge variant="secondary">Reserve Met</Badge>
                  )}
                  {listing.buy_now_enabled && !listing.reserve_met && (
                    <Badge variant="outline">Buy Now Available</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{listing.title}</h1>
              </div>

              {/* Combined Bidding Card - Mobile Only */}
              <div className="lg:hidden">
                <CombinedBiddingCard
                  listingId={listing.id}
                  currentPrice={listing.current_price || listing.start_price}
                  startPrice={listing.start_price}
                  reservePrice={listing.reserve_price}
                  reserveMet={listing.reserve_met}
                  buyNowPrice={listing.buy_now_price}
                  buyNowEnabled={listing.buy_now_enabled}
                  endTime={listing.end_time}
                  isLive={isActuallyLive}
                  canBid={!!canBid}
                  isLoggedIn={!!user}
                  hasProfile={!!profile}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <WatchlistToggleButton 
                  listingId={listing.id}
                  userId={profile?.id}
                />
                <ShareButton 
                  listingId={listing.id}
                  title={listing.title}
                />
                <ReportButton 
                  listingId={listing.id}
                  userId={profile?.id}
                />
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

              {/* Questions & Answers */}
              <AuctionQuestions
                listingId={listing.id}
                isOwner={isOwner}
                isLoggedIn={!!profile}
              />

              {/* Payment Preferences */}
              {listing.profiles?.payment_preferences && 
               listing.profiles.payment_preferences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      The seller accepts the following payment methods:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {listing.profiles.payment_preferences.map((method) => (
                        <Badge key={method} variant="secondary" className="text-sm">
                          {formatPaymentMethod(method)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Views and Share */}
              <ViewsAndShare 
                viewCount={viewCount}
                listingId={listing.id}
                title={listing.title}
              />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Combined Bidding Card - Desktop Only */}
              <div className="hidden lg:block">
                <CombinedBiddingCard
                  listingId={listing.id}
                  currentPrice={listing.current_price || listing.start_price}
                  startPrice={listing.start_price}
                  reservePrice={listing.reserve_price}
                  reserveMet={listing.reserve_met}
                  buyNowPrice={listing.buy_now_price}
                  buyNowEnabled={listing.buy_now_enabled}
                  endTime={listing.end_time}
                  isLive={isActuallyLive}
                  canBid={!!canBid}
                  isLoggedIn={!!user}
                  hasProfile={!!profile}
                />
              </div>

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
                    <div className="flex-1">
                      <div className="font-semibold">
                        @{listing.profiles?.username || 'unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Seller
                      </div>
                      {sellerRating ? (
                        <UserRatingDisplay
                          rating={sellerRating.average_rating}
                          reviewCount={sellerRating.review_count}
                          size="sm"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No reviews yet
                        </div>
                      )}
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
                    <span>Location:</span>
                    <span className="font-medium">{listing.location}</span>
                  </div>
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

