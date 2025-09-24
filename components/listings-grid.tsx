import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { generateListingUrl } from '@/lib/url-utils'

interface ListingsGridProps {
  searchParams: {
    q?: string
    category?: string
    sort?: string
    filter?: string
    price_min?: string
    price_max?: string
    condition?: string
    status?: string
  }
}

export async function ListingsGrid({ searchParams }: ListingsGridProps) {
  const supabase = createClient()
  
  let query = supabase
    .from('listings')
    .select(`
      *,
      categories (
        name,
        slug
      ),
      profiles!listings_owner_id_fkey (
        username
      )
    `)
    .in('status', ['live', 'ended', 'sold'])
    .limit(12)

  // Apply search query
  if (searchParams.q) {
    query = query.textSearch('title', searchParams.q, {
      type: 'websearch',
      config: 'english'
    })
  }

  // Apply category filter
  if (searchParams.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', searchParams.category)
      .single()
    
    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  // Apply price filters
  if (searchParams.price_min) {
    const minPrice = parseFloat(searchParams.price_min)
    if (!isNaN(minPrice)) {
      query = query.gte('current_price', minPrice)
    }
  }
  
  if (searchParams.price_max) {
    const maxPrice = parseFloat(searchParams.price_max)
    if (!isNaN(maxPrice)) {
      query = query.lte('current_price', maxPrice)
    }
  }

  // Apply condition filter
  if (searchParams.condition && searchParams.condition !== 'all') {
    query = query.eq('condition', searchParams.condition)
  }

  // Apply status filter
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  // Apply special filters
  if (searchParams.filter) {
    const now = new Date().toISOString()
    
    switch (searchParams.filter) {
      case 'ending-soon':
        query = query
          .eq('status', 'live')
          .gte('end_time', now)
          .lte('end_time', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // Next 2 hours
        break
      case 'live':
        query = query.eq('status', 'live')
        break
      case 'reserve-met':
        query = query
          .eq('status', 'live')
          .eq('reserve_met', true)
        break
      case 'buy-now':
        query = query.not('buy_now_price', 'is', null)
        break
    }
  }

  // Apply sorting
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'price-low':
        query = query.order('current_price', { ascending: true })
        break
      case 'price-high':
        query = query.order('current_price', { ascending: false })
        break
      case 'ending-soon':
        query = query.order('end_time', { ascending: true })
        break
      case 'most-bids':
        // This would require a join with bids table, for now use created_at
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }
  } else {
    // Default sorting
    query = query.order('created_at', { ascending: false })
  }

  const { data: listings, error } = await query

  if (error) {
    console.error('Error fetching listings:', error)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load listings</p>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings found</p>
      </div>
    )
  }

  // Generate URLs for all listings
  const listingsWithUrls = await Promise.all(
    listings.map(async (listing) => {
      const listingUrl = await generateListingUrl({ 
        id: listing.id, 
        category_id: listing.category_id 
      })
      return { listing, listingUrl }
    })
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listingsWithUrls.map(({ listing, listingUrl }) => (
        <ListingCard 
          key={listing.id} 
          listing={listing} 
          listingUrl={listingUrl}
        />
      ))}
    </div>
  )
}
