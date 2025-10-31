import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { BidsTabsWrapper } from './bids-tabs-wrapper'

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

  // Fetch contact exchanges for this user as buyer
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
      seller:profiles!auction_contacts_seller_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('buyer_id', profile.id)
    .order('created_at', { ascending: false })

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

  return (
    <BidsTabsWrapper
      activeBids={activeBids}
      outbidBids={outbidBids}
      wonBids={wonBids}
      lostBids={lostBids}
      contactExchanges={contactExchanges || []}
      profileId={profile.id}
    />
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
