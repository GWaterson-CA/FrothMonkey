import { createClient } from '@/lib/supabase/server'

// URL generation helpers for the new URL structure
export async function generateListingUrl(listing: {
  id: string
  category_id: string
}): Promise<string> {
  const supabase = createClient()
  
  // Get the category with its parent information
  const { data: category } = await supabase
    .from('categories')
    .select(`
      slug,
      parent_id,
      parent:parent_id (
        slug
      )
    `)
    .eq('id', listing.category_id)
    .single()
  
  if (!category) {
    return `/listing/${listing.id}`
  }
  
  // If it's a subcategory, include both parent and subcategory
  if (category.parent_id && category.parent) {
    return `/${category.parent.slug}/${category.slug}/${listing.id}`
  }
  
  // If it's a main category
  return `/${category.slug}/${listing.id}`
}

export async function generateCategoryUrl(category: {
  slug: string
  parent_id: string | null
}): Promise<string> {
  if (category.parent_id) {
    // For subcategories, we need to get the parent category
    const supabase = createClient()
    const { data: parentCategory } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', category.parent_id)
      .single()
    
    if (parentCategory) {
      return `/${parentCategory.slug}/${category.slug}`
    }
  }
  
  return `/${category.slug}`
}

// Helper to get category hierarchy from a category ID
export async function getCategoryHierarchy(categoryId: string): Promise<{
  category: { slug: string }
  subcategory?: { slug: string }
} | null> {
  const supabase = createClient()
  
  const { data: category } = await supabase
    .from('categories')
    .select(`
      slug,
      parent_id,
      parent:parent_id (
        slug
      )
    `)
    .eq('id', categoryId)
    .single()
  
  if (!category) {
    return null
  }
  
  if (category.parent_id && category.parent) {
    return {
      category: category.parent,
      subcategory: { slug: category.slug }
    }
  }
  
  return {
    category: { slug: category.slug }
  }
}

// Helper to generate breadcrumb URLs
export async function generateBreadcrumbUrls(categoryId: string): Promise<Array<{
  name: string
  url: string
}>> {
  const hierarchy = await getCategoryHierarchy(categoryId)
  
  if (!hierarchy) {
    return []
  }
  
  const breadcrumbs = [
    { name: 'All Categories', url: '/' },
    { name: hierarchy.category.slug.replace('-', ' '), url: `/${hierarchy.category.slug}` }
  ]
  
  if (hierarchy.subcategory) {
    breadcrumbs.push({
      name: hierarchy.subcategory.slug.replace('-', ' '),
      url: `/${hierarchy.category.slug}/${hierarchy.subcategory.slug}`
    })
  }
  
  return breadcrumbs
}
