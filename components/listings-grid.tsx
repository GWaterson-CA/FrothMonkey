import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'

interface ListingsGridProps {
  searchParams: {
    q?: string
    category?: string
    sort?: string
    filter?: string
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

  // Apply special filters
  if (searchParams.filter) {
    const now = new Date().toISOString()
    
    switch (searchParams.filter) {
      case 'ending-soon':
        query = query
          .eq('status', 'live')
          .gte('end_time', now)
          .lte('end_time', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // Next 2 hours
          .order('end_time', { ascending: true })
        break
      case 'newly-listed':
        query = query
          .eq('status', 'live')
          .order('created_at', { ascending: false })
        break
      case 'reserve-met':
        query = query
          .eq('status', 'live')
          .eq('reserve_met', true)
          .order('end_time', { ascending: true })
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
