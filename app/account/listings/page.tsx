import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Eye, Trash2, Package, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { formatCurrency, formatDateTime, isAuctionEnded } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'
import { ContactExchangeCard } from '@/components/account/contact-exchange-card'

async function MyListingsContent() {
  const profile = await getUserProfile()
  const supabase = createClient()

  if (!profile) {
    return <div>Profile not found</div>
  }

  // Fetch user's listings grouped by status
  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      *,
      categories (
        name,
        slug
      ),
      bids (
        id
      )
    `)
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
    return <div>Error loading listings</div>
  }

  // Fetch contact exchanges for this user's listings
  const { data: contactExchanges } = await supabase
    .from('auction_contacts')
    .select(`
      *,
      listing:listings (
        id,
        title,
        cover_image_url,
        location,
        end_time
      ),
      buyer:profiles!auction_contacts_buyer_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('seller_id', profile.id)
    .order('created_at', { ascending: false })

  // Group listings by status
  const draftListings = listings?.filter(l => l.status === 'draft') || []
  const liveListings = listings?.filter(l => l.status === 'live') || []
  const endedListings = listings?.filter(l => ['ended', 'sold', 'cancelled'].includes(l.status)) || []

  const ListingCard = ({ listing }: { listing: any }) => {
    const hasEnded = isAuctionEnded(listing.end_time)
    const isActuallyLive = listing.status === 'live' && !hasEnded
    
    return (
      <Card key={listing.id}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{listing.title}</h3>
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
                  <Badge
                    variant={
                      listing.status === 'sold'
                        ? 'default'
                        : listing.status === 'draft'
                        ? 'outline'
                        : 'secondary'
                    }
                  >
                    {listing.status}
                  </Badge>
                )}
              {listing.reserve_met && (
                <Badge variant="secondary">Reserve Met</Badge>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Category: {listing.categories?.name || 'Unknown'}</div>
              <div>
                {hasEnded ? 'Final price:' : 'Current price:'} {formatCurrency(listing.current_price || listing.start_price)}
              </div>
              {listing.reserve_price && (
                <div>Reserve: {formatCurrency(listing.reserve_price)}</div>
              )}
              {listing.buy_now_price && (
                <div>Buy now: {formatCurrency(listing.buy_now_price)}</div>
              )}
              {hasEnded ? (
                <div className="font-medium text-foreground">
                  {listing.bids?.length === 0 
                    ? 'No bids placed' 
                    : listing.bids?.length === 1 
                    ? '1 bid placed' 
                    : `${listing.bids?.length || 0} bids placed`}
                  {listing.bids?.length > 0 && ` • Sold for ${formatCurrency(listing.current_price || listing.start_price)}`}
                </div>
              ) : (
                <div>Bids: {listing.bids?.length || 0}</div>
              )}
              {isActuallyLive && (
                <div className="flex items-center gap-2">
                  <span>Ends:</span>
                  <CountdownTimer endTime={listing.end_time} />
                </div>
              )}
              {!isActuallyLive && (
                <div>
                  {listing.status === 'draft' ? 'Created:' : 'Ended:'} {formatDateTime(listing.created_at)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/listing/${listing.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            
            {(listing.status === 'draft' || listing.status === 'scheduled' || listing.status === 'live') && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/sell/${listing.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            )}

            {listing.status === 'draft' && (
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    )
  }

  return (
    <Tabs defaultValue="live" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList>
          <TabsTrigger value="live">
            Live ({liveListings.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({draftListings.length})
          </TabsTrigger>
          <TabsTrigger value="ended">
            Ended ({endedListings.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contact Exchanges ({contactExchanges?.length || 0})
          </TabsTrigger>
        </TabsList>

        <Button asChild>
          <Link href="/sell/new">
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Link>
        </Button>
      </div>

      <TabsContent value="live" className="space-y-4">
        {liveListings.length > 0 ? (
          liveListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No live auctions</p>
                <p className="text-sm">Your active auctions will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="draft" className="space-y-4">
        {draftListings.length > 0 ? (
          draftListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No draft listings</p>
                <p className="text-sm">Create a new listing to get started</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="ended" className="space-y-4">
        {endedListings.length > 0 ? (
          endedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No ended auctions</p>
                <p className="text-sm">Completed auctions will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        {contactExchanges && contactExchanges.length > 0 ? (
          contactExchanges.map((contact: any) => (
            <ContactExchangeCard
              key={contact.id}
              contact={contact}
              currentUserId={profile.id}
              role="seller"
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No contact exchanges</p>
                <p className="text-sm">When your auctions end, contact exchanges will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default function MyListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Listings</h1>
        <p className="text-muted-foreground">
          Manage your auction listings and track their performance.
        </p>
      </div>

      <Suspense fallback={<div>Loading listings...</div>}>
        <MyListingsContent />
      </Suspense>
    </div>
  )
}
