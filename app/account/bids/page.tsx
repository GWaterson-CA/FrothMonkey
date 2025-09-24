import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Trophy, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { formatCurrency, formatDateTime, getEffectiveAuctionStatus, isAuctionEffectivelyLive } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'

async function MyBidsContent() {
  const profile = await requireProfile()
  if (!profile) return <div>Profile not found</div>
  
  const supabase = createClient()

  // Define the type for the joined query result
  type BidWithListing = {
    id: number
    amount: number
    bidder_id: string
    listing_id: string
    created_at: string
    listings: {
      id: string
      title: string
      status: string
      current_price: number
      end_time: string
      cover_image_url: string | null
      categories: {
        name: string
      } | null
    }
  }

  // Fetch user's bids with listing information
  const { data: bids, error } = await supabase
    .from('bids')
    .select(`
      *,
      listings!bids_listing_id_fkey (
        id,
        title,
        status,
        current_price,
        end_time,
        cover_image_url,
        categories (
          name
        )
      )
    `)
    .eq('bidder_id', profile.id)
    .order('created_at', { ascending: false }) as { data: BidWithListing[] | null, error: any }

  if (error) {
    console.error('Error fetching bids:', error)
    return <div>Error loading bids</div>
  }

  // Get unique listings and determine user's status for each
  const listingBids = new Map()
  
  bids?.forEach(bid => {
    const listingId = bid.listings.id
    if (!listingBids.has(listingId) || bid.amount > listingBids.get(listingId).amount) {
      listingBids.set(listingId, {
        ...bid,
        isHighestBid: bid.amount === bid.listings.current_price,
        totalBids: bids.filter(b => b.listings.id === listingId).length
      })
    }
  })

  const uniqueBids = Array.from(listingBids.values())

  // Categorize bids
  const activeBids = uniqueBids.filter(bid => 
    bid.listings.status === 'live' && bid.isHighestBid
  )
  
  const outbidBids = uniqueBids.filter(bid => 
    bid.listings.status === 'live' && !bid.isHighestBid
  )
  
  const wonBids = uniqueBids.filter(bid => 
    bid.listings.status === 'sold' && bid.isHighestBid
  )
  
  const lostBids = uniqueBids.filter(bid => 
    ['ended', 'sold'].includes(bid.listings.status) && !bid.isHighestBid
  )

  const BidCard = ({ bid, status }: { bid: any; status: 'active' | 'outbid' | 'won' | 'lost' }) => (
    <Card key={`${bid.listings.id}-${status}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{bid.listings.title}</h3>
              <Badge
                variant={
                  status === 'active'
                    ? 'success'
                    : status === 'won'
                    ? 'default'
                    : status === 'outbid'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {status === 'active' ? 'Winning' : 
                 status === 'won' ? 'Won' :
                 status === 'outbid' ? 'Outbid' : 'Lost'}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Category: {bid.listings.categories?.name || 'Unknown'}</div>
              <div>Your bid: {formatCurrency(bid.amount)}</div>
              <div>Current price: {formatCurrency(bid.listings.current_price)}</div>
              <div>Total bids: {bid.totalBids}</div>
              
              {isAuctionEffectivelyLive(bid.listings.status, bid.listings.start_time, bid.listings.end_time) ? (
                <div className="flex items-center gap-2">
                  <span>Ends:</span>
                  <CountdownTimer endTime={bid.listings.end_time} />
                </div>
              ) : (
                <div>Ended: {formatDateTime(bid.listings.end_time)}</div>
              )}
              
              <div>Bid placed: {formatDateTime(bid.created_at)}</div>
            </div>

            {status === 'won' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Congratulations! You won this auction.
                  </span>
                </div>
              </div>
            )}

            {status === 'outbid' && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You've been outbid by {formatCurrency(bid.listings.current_price - bid.amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/listing/${bid.listings.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">
          Active ({activeBids.length})
        </TabsTrigger>
        <TabsTrigger value="outbid">
          Outbid ({outbidBids.length})
        </TabsTrigger>
        <TabsTrigger value="won">
          Won ({wonBids.length})
        </TabsTrigger>
        <TabsTrigger value="lost">
          Lost ({lostBids.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4 mt-6">
        {activeBids.length > 0 ? (
          activeBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="active" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No active bids</p>
                <p className="text-sm">Bids where you're currently winning will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="outbid" className="space-y-4 mt-6">
        {outbidBids.length > 0 ? (
          outbidBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="outbid" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <X className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No outbid items</p>
                <p className="text-sm">Items where you've been outbid will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="won" className="space-y-4 mt-6">
        {wonBids.length > 0 ? (
          wonBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="won" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No won auctions</p>
                <p className="text-sm">Auctions you've won will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="lost" className="space-y-4 mt-6">
        {lostBids.length > 0 ? (
          lostBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="lost" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <X className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No lost auctions</p>
                <p className="text-sm">Auctions you didn't win will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default function MyBidsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bids</h1>
        <p className="text-muted-foreground">
          Track your bidding activity and see which auctions you're winning.
        </p>
      </div>

      <Suspense fallback={<div>Loading bids...</div>}>
        <MyBidsContent />
      </Suspense>
    </div>
  )
}
