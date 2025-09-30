import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ListingsGrid } from '@/components/listings-grid'
import { createClient } from '@/lib/supabase/server'

interface CategoryPageProps {
  params: {
    slug: string
  }
  searchParams: {
    q?: string
    sort?: string
    filter?: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', params.slug)
    .single()

  if (!category) {
    return {
      title: 'Category Not Found | FrothMonkey',
    }
  }

  return {
    title: `${category.name} Auctions | FrothMonkey`,
    description: `Browse ${category.name} auctions and find great deals`,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const supabase = createClient()

  // Fetch category information
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !category) {
    notFound()
  }

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

  // Get listing count for this category and all subcategories
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .in('category_id', categoryIds)
    .in('status', ['live', 'ended', 'sold'])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Category Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            <p className="text-muted-foreground">
              {listingCount} {listingCount === 1 ? 'auction' : 'auctions'} in this category
            </p>
          </div>

          {/* Search Results */}
          {searchParams.q && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Search results for "{searchParams.q}" in {category.name}
              </h2>
            </div>
          )}

          {/* Filters and Sorting */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing auctions in {category.name}
              {subcategories && subcategories.length > 0 && ' and its subcategories'}
            </div>
            
            {/* TODO: Add filter and sort controls */}
            <div className="text-sm text-muted-foreground">
              Sort and filter controls coming soon
            </div>
          </div>

          {/* Listings Grid */}
          <Suspense fallback={<div>Loading auctions...</div>}>
            <ListingsGrid 
              searchParams={{
                ...searchParams,
                category: params.slug,
              }} 
            />
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
