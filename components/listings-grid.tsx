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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
