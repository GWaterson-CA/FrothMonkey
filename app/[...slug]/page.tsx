import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ListingsGrid } from '@/components/listings-grid'
import { FilterControls } from '@/components/filter-controls'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { getEffectiveAuctionStatus, isAuctionEffectivelyLive } from '@/lib/utils'

interface SlugPageProps {
  params: {
    slug: string[]
  }
  searchParams: {
    q?: string
    sort?: string
    filter?: string
  }
}

// Helper function to get category hierarchy from slug
async function getCategoryFromSlug(slug: string[]) {
  const supabase = createClient()
  
  if (slug.length === 1) {
    // Single slug - could be main category or listing ID
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug[0])
      .is('parent_id', null)
      .single()
    
    if (category) {
      return { type: 'category' as const, category, subcategory: null }
    }
    
    // Check if it's a listing ID
    const { data: listing } = await supabase
      .from('listings')
      .select(`
        *,
        categories (
          name,
          slug,
          parent_id
        ),
        profiles!listings_owner_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', slug[0])
      .single()
    
    if (listing) {
      return { type: 'listing' as const, listing }
    }
  } else if (slug.length === 2) {
    // Two slugs - could be category/subcategory or category/listing-id
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug[0])
      .is('parent_id', null)
      .single()
    
    if (category) {
      const { data: subcategory } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug[1])
        .eq('parent_id', category.id)
        .single()
      
      if (subcategory) {
        return { type: 'subcategory' as const, category, subcategory }
      }
      
      // Check if second slug is a listing ID in this category
      const { data: listing } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            name,
            slug,
            parent_id
          ),
          profiles!listings_owner_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', slug[1])
        .eq('category_id', category.id)
        .single()
      
      if (listing) {
        return { type: 'listing' as const, listing }
      }
    }
  } else if (slug.length === 3) {
    // Three slugs - category/subcategory/listing-id
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug[0])
      .is('parent_id', null)
      .single()
    
    if (category) {
      const { data: subcategory } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug[1])
        .eq('parent_id', category.id)
        .single()
      
      if (subcategory) {
        const { data: listing } = await supabase
          .from('listings')
          .select(`
            *,
            categories (
              name,
              slug,
              parent_id
            ),
            profiles!listings_owner_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', slug[2])
          .eq('category_id', subcategory.id)
          .single()
        
        if (listing) {
          return { type: 'listing' as const, listing }
        }
      }
    }
  }
  
  return null
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const result = await getCategoryFromSlug(params.slug)
  
  if (!result) {
    return {
      title: 'Page Not Found | FrothMonkey',
    }
  }
  
  if (result.type === 'listing') {
    const listing = result.listing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://frothmonkey.com'
    const listingUrl = `${baseUrl}/${params.slug.join('/')}`
    const ogImageUrl = `${baseUrl}/api/og/listing/${listing.id}`
    
    const currentPrice = listing.current_price || listing.start_price
    const priceText = currentPrice > 0 ? `Current bid: $${currentPrice.toLocaleString()}` : `Starting at $${listing.start_price.toLocaleString()}`
    
    const description = listing.description 
      ? `${listing.description.substring(0, 120)}...`
      : `Auction for ${listing.title}. ${priceText}.`

    return {
      title: `${listing.title} | FrothMonkey`,
      description,
      openGraph: {
        title: `${listing.title} | FrothMonkey`,
        description,
        url: listingUrl,
        siteName: 'FrothMonkey',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: listing.title,
            type: 'image/png',
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
    }
  } else if (result.type === 'category') {
    return {
      title: `${result.category.name} Auctions | FrothMonkey`,
      description: `Browse ${result.category.name} auctions and find great deals`,
    }
  } else if (result.type === 'subcategory') {
    return {
      title: `${result.subcategory.name} Auctions | FrothMonkey`,
      description: `Browse ${result.subcategory.name} auctions in ${result.category.name} and find great deals`,
    }
  }
  
  return {
    title: 'Page Not Found | FrothMonkey',
  }
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
  const result = await getCategoryFromSlug(params.slug)
  
  if (!result) {
    notFound()
  }
  
  if (result.type === 'listing') {
    // Render the listing page directly with the new URL structure
    const listing = result.listing
    const supabase = createClient()
    const profile = await getUserProfile()
    
    // Fetch recent bids
    const { data: bids } = await supabase
      .from('bids')
      .select(`
        *,
        profiles!bids_bidder_id_fkey (
          id,
          username
        )
      `)
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get highest bid for auction results
    const highestBid = bids && bids.length > 0 ? bids[0] : null

    const isOwner = profile?.id === listing.owner_id
    const effectiveStatus = getEffectiveAuctionStatus(listing.status, listing.start_time, listing.end_time)
    const canBid = profile && !isOwner && isAuctionEffectivelyLive(listing.status, listing.start_time, listing.end_time)

    // Fetch seller rating
    let sellerRating = null
    if (listing.owner_id) {
      const { data: ratingData } = await supabase
        .rpc('get_user_rating', { user_uuid: listing.owner_id })
      
      if (ratingData) {
        sellerRating = ratingData
      }
    }

    // Generate the proper listing URL for sharing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://frothmonkey.com'
    const listingUrl = `${baseUrl}/${params.slug.join('/')}`

    // Import necessary components
    const { Header } = await import('@/components/header')
    const { Footer } = await import('@/components/footer')
    const { Badge } = await import('@/components/ui/badge')
    const { Card, CardContent, CardHeader, CardTitle } = await import('@/components/ui/card')
    const { formatCurrency, formatDateTime, getImageUrl } = await import('@/lib/utils')
    const { CountdownTimer } = await import('@/components/countdown-timer')
    const { BidHistory } = await import('@/components/bid-history')
    const { BidForm } = await import('@/components/bid-form')
    const { ListingImages } = await import('@/components/listing-images')
    const { AuctionQuestions } = await import('@/components/auction-questions')
    const { UserRatingDisplay } = await import('@/components/reviews/star-rating')
    const { WatchlistToggleButton } = await import('@/components/account/watchlist-toggle-button')
    const { ShareButton } = await import('@/components/share-button')
    const { ReportButton } = await import('@/components/report-button')
    const { AnalyticsTracker } = await import('@/components/analytics-tracker')
    const { ContactSellerButton } = await import('@/components/messaging/contact-seller-button')
    const { AuctionResults } = await import('@/components/auction-results')

    return (
      <div className="min-h-screen flex flex-col">
        <AnalyticsTracker listingId={listing.id} />
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
                        variant={effectiveStatus === 'live' ? 'success' : effectiveStatus === 'sold' ? 'default' : 'secondary'}
                      >
                        {effectiveStatus}
                      </Badge>
                      {listing.reserve_met && (
                        <Badge variant="secondary">Reserve Met</Badge>
                      )}
                      {listing.buy_now_enabled && !listing.reserve_met && (
                        <Badge variant="outline">Buy Now Available</Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold">{listing.title}</h1>
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
                      listingUrl={listingUrl}
                    />
                    <ReportButton 
                      listingId={listing.id}
                      userId={profile?.id}
                    />
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

                {/* Questions & Answers */}
                <AuctionQuestions
                  listingId={listing.id}
                  isOwner={isOwner}
                  isLoggedIn={!!profile}
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
                      {listing.buy_now_price && !listing.reserve_met && (
                        <div className="flex justify-between">
                          <span>Buy now price:</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(listing.buy_now_price)}
                          </span>
                        </div>
                      )}
                    </div>

                    {effectiveStatus === 'live' && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground mb-2">
                          Time remaining:
                        </div>
                        <CountdownTimer endTime={listing.end_time} />
                      </div>
                    )}
                    {effectiveStatus === 'ended' && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground">
                          Auction ended: {formatDateTime(listing.end_time)}
                        </div>
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
                    reserveMet={listing.reserve_met}
                  />
                )}

                {/* Auction Results - show for ended auctions */}
                {effectiveStatus === 'ended' && (
                  <AuctionResults
                    listing={listing}
                    highestBid={highestBid}
                    currentUserId={profile?.id}
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
                      <div className="flex-1">
                        <div className="font-semibold">
                          @{listing.profiles?.username || 'Unknown'}
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
                    
                    {/* Contact Seller Button - only show for ended auctions */}
                    {effectiveStatus === 'ended' && (
                      <div className="mt-4">
                        <ContactSellerButton
                          listingId={listing.id}
                          sellerId={listing.owner_id}
                          currentUserId={profile?.id}
                        />
                      </div>
                    )}
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
  
  // Handle category and subcategory pages
  const category = result.type === 'subcategory' ? result.subcategory : result.category
  const parentCategory = result.type === 'subcategory' ? result.category : null
  
  const supabase = createClient()
  
  // Get listing count for this category
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .in('status', ['live', 'ended', 'sold'])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              {parentCategory && (
                <>
                  <a href={`/${parentCategory.slug}`} className="hover:text-foreground">
                    {parentCategory.name}
                  </a>
                  <span>/</span>
                </>
              )}
              <span>{category.name}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            <p className="text-muted-foreground">
              {listingCount} {listingCount === 1 ? 'auction' : 'auctions'} in this category
            </p>
          </div>

          {/* Search Results */}
          {searchParams.q && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Search results for "{searchParams.q}" in {category.name}
              </h2>
            </div>
          )}

          {/* Filter Controls */}
          <FilterControls 
            currentCategory={parentCategory?.slug}
            currentSubcategory={result.type === 'subcategory' ? category.slug : undefined}
          />

          {/* Listings Grid */}
          <Suspense fallback={<div>Loading auctions...</div>}>
            <ListingsGrid 
              searchParams={{
                ...searchParams,
                category: category.slug,
              }} 
            />
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
