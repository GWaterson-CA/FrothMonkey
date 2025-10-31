import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { ListingsTabsWrapper } from './listings-tabs-wrapper'

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
      seller:profiles!auction_contacts_seller_id_fkey (
        id,
        username,
        full_name,
        avatar_url
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

  return (
    <ListingsTabsWrapper
      liveListings={liveListings}
      draftListings={draftListings}
      endedListings={endedListings}
      contactExchanges={contactExchanges || []}
      profileId={profile.id}
    />
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
