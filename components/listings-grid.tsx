import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'

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
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Calculate timestamp for 12 hours ago (for recently ended auctions)
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  
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
      ),
      bids!listing_id (
        id
      )
    `)
    .limit(12)
  
  // Only show live auctions OR recently ended auctions (ended within last 12 hours)
  // We'll apply the status/time filter after getting the base query
  query = query.or(`status.eq.live,and(status.eq.ended,end_time.gte.${twelveHoursAgo}),and(status.eq.sold,end_time.gte.${twelveHoursAgo})`)

  // Apply search query with partial matching
  if (searchParams.q) {
    const searchTerm = searchParams.q.trim()
    // Use ILIKE for partial matching (case-insensitive)
    // Search in both title and description for better results
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }

  // Apply category filter
  if (searchParams.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', searchParams.category)
      .single()
    
    if (category) {
      // Get all subcategories for this category
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', category.id)
      
      // Build array of category IDs (parent + all children)
      const categoryIds = [category.id]
      if (subcategories && subcategories.length > 0) {
        categoryIds.push(...subcategories.map(sub => sub.id))
      }
      
      // Filter by parent category OR any of its subcategories
      query = query.in('category_id', categoryIds)
    }
  }

  // Apply special filters
  if (searchParams.filter) {
    const now = new Date().toISOString()
    
    switch (searchParams.filter) {
      case 'ending-soon':
        // Override the base status filter to only show live auctions
        query = supabase
          .from('listings')
          .select(`
            *,
            categories (
              name,
              slug
            ),
            profiles!listings_owner_id_fkey (
              username
            ),
            bids!listing_id (
              id
            )
          `)
          .eq('status', 'live')
          .gte('end_time', now)
          .lte('end_time', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // Next 2 hours
          .order('end_time', { ascending: true })
          .limit(12)
        
        // Re-apply search and category filters if present
        if (searchParams.q) {
          const searchTerm = searchParams.q.trim()
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
        if (searchParams.category) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', searchParams.category)
            .single()
          
          if (category) {
            const { data: subcategories } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', category.id)
            
            const categoryIds = [category.id]
            if (subcategories && subcategories.length > 0) {
              categoryIds.push(...subcategories.map(sub => sub.id))
            }
            
            query = query.in('category_id', categoryIds)
          }
        }
        break
      case 'newly-listed':
        // Override the base status filter to only show live auctions
        query = supabase
          .from('listings')
          .select(`
            *,
            categories (
              name,
              slug
            ),
            profiles!listings_owner_id_fkey (
              username
            ),
            bids!listing_id (
              id
            )
          `)
          .eq('status', 'live')
          .order('created_at', { ascending: false })
          .limit(12)
        
        // Re-apply search and category filters if present
        if (searchParams.q) {
          const searchTerm = searchParams.q.trim()
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
        if (searchParams.category) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', searchParams.category)
            .single()
          
          if (category) {
            const { data: subcategories } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', category.id)
            
            const categoryIds = [category.id]
            if (subcategories && subcategories.length > 0) {
              categoryIds.push(...subcategories.map(sub => sub.id))
            }
            
            query = query.in('category_id', categoryIds)
          }
        }
        break
      case 'reserve-met':
        // Override the base status filter to only show live auctions
        query = supabase
          .from('listings')
          .select(`
            *,
            categories (
              name,
              slug
            ),
            profiles!listings_owner_id_fkey (
              username
            ),
            bids!listing_id (
              id
            )
          `)
          .eq('status', 'live')
          .eq('reserve_met', true)
          .order('end_time', { ascending: true })
          .limit(12)
        
        // Re-apply search and category filters if present
        if (searchParams.q) {
          const searchTerm = searchParams.q.trim()
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
        if (searchParams.category) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', searchParams.category)
            .single()
          
          if (category) {
            const { data: subcategories } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', category.id)
            
            const categoryIds = [category.id]
            if (subcategories && subcategories.length > 0) {
              categoryIds.push(...subcategories.map(sub => sub.id))
            }
            
            query = query.in('category_id', categoryIds)
          }
        }
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">No listings found</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {searchParams.q 
            ? `No auctions match your search "${searchParams.q}". Try different keywords or browse categories.`
            : searchParams.category
            ? "There are no active auctions in this category yet."
            : "There are no active auctions at the moment."
          }
        </p>
        
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/sell/new">
              <Plus className="h-4 w-4 mr-2" />
              Create a Listing
            </Link>
          </Button>
          
          {searchParams.q || searchParams.category ? (
            <Button variant="outline" asChild>
              <Link href="/">
                Browse All Auctions
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  // Fetch user's favorites if logged in
  let userFavorites: Set<string> = new Set()
  if (user) {
    const { data: favorites } = await supabase
      .from('watchlists')
      .select('listing_id')
      .eq('user_id', user.id)
    
    if (favorites) {
      userFavorites = new Set(favorites.map(f => f.listing_id))
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={{
            ...listing,
            bid_count: Array.isArray(listing.bids) ? listing.bids.length : 0
          }}
          initialIsFavorited={userFavorites.has(listing.id)}
          initialFavoriteCount={listing.favorite_count || 0}
          currentUserId={user?.id}
        />
      ))}
    </div>
  )
}
