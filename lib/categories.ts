import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'

export interface CategoryWithSubcategories extends Tables<'categories'> {
  subcategories?: Tables<'categories'>[]
}

/**
 * Fetch all categories with their subcategories and listing counts
 * @param includeEmpty - Whether to include categories with 0 listings (default: true for admin/sell flows)
 */
export async function getCategoriesWithCounts(includeEmpty: boolean = true): Promise<CategoryWithSubcategories[]> {
  const supabase = createClient()
  
  // Fetch top-level categories
  const { data: topLevelCategories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order')
  
  // Fetch all subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .not('parent_id', 'is', null)
    .order('sort_order')
  
  // If we need to filter empty categories, we need to check if they have ANY listings (not just active)
  let categoryIdsWithListings: Set<string> | null = null
  
  if (!includeEmpty) {
    // Get all category IDs that have at least one listing (live, ended, or sold)
    const { data: categoriesWithListings } = await supabase
      .from('listings')
      .select('category_id')
      .in('status', ['live', 'ended', 'sold'])
    
    if (categoriesWithListings) {
      categoryIdsWithListings = new Set(categoriesWithListings.map(l => l.category_id))
    }
  }
  
  // Group subcategories by parent and filter if needed
  const categoriesWithSubs: CategoryWithSubcategories[] = (topLevelCategories || [])
    .map((category) => {
      const categoryId = category.id
      let subs = (subcategories || []).filter((sub) => sub.parent_id === categoryId)
      
      // Filter subcategories if needed
      if (!includeEmpty && categoryIdsWithListings) {
        subs = subs.filter(sub => categoryIdsWithListings.has(sub.id))
      }
      
      return {
        ...category,
        subcategories: subs
      }
    })
    .filter(category => {
      // If includeEmpty is false, only include categories that:
      // 1. Have listings directly in the category, OR
      // 2. Have at least one subcategory with listings
      if (!includeEmpty && categoryIdsWithListings) {
        const hasDirectListings = categoryIdsWithListings.has(category.id)
        const hasSubcategoryListings = category.subcategories && category.subcategories.length > 0
        return hasDirectListings || hasSubcategoryListings
      }
      return true
    })
  
  // Sort categories by active listing count (highest first), then by sort_order
  if (!includeEmpty) {
    categoriesWithSubs.sort((a, b) => {
      // First sort by active count (descending)
      if (b.active_listing_count !== a.active_listing_count) {
        return b.active_listing_count - a.active_listing_count
      }
      // Then by sort_order (ascending)
      return (a.sort_order || 999) - (b.sort_order || 999)
    })
  }
  
  return categoriesWithSubs
}

/**
 * Get all categories for admin/sell flows (includes empty categories)
 */
export async function getAllCategories(): Promise<CategoryWithSubcategories[]> {
  return getCategoriesWithCounts(true)
}

/**
 * Get categories with any listings (live, ended, or sold) for browsing
 * Excludes categories that have never had any listings
 */
export async function getActiveCategories(): Promise<CategoryWithSubcategories[]> {
  return getCategoriesWithCounts(false)
}

/**
 * Get recently finished auctions for a category (for empty state social proof)
 * @param categoryId - Optional category ID to filter by
 * @param limit - Number of results to return (default: 6)
 */
export async function getRecentlyFinishedAuctions(categoryId?: string, limit: number = 6) {
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
      ),
      bids (
        id,
        amount
      )
    `)
    .in('status', ['ended', 'sold'])
    .order('end_time', { ascending: false })
    .limit(limit)
  
  if (categoryId) {
    // Get subcategories for this category
    const { data: subcategories } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', categoryId)
    
    const categoryIds = [categoryId]
    if (subcategories && subcategories.length > 0) {
      categoryIds.push(...subcategories.map(sub => sub.id))
    }
    
    query = query.in('category_id', categoryIds)
  }
  
  const { data: listings } = await query
  
  // Add computed fields
  return (listings || []).map(listing => ({
    ...listing,
    bidCount: listing.bids?.length || 0,
    highestBid: listing.bids && listing.bids.length > 0 
      ? Math.max(...listing.bids.map(b => b.amount))
      : listing.starting_price
  }))
}

