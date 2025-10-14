import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ListingsGrid } from '@/components/listings-grid'
import { HorizontalCategoryBar } from '@/components/horizontal-category-bar'
import { RecentlyFinishedAuctions } from '@/components/recently-finished-auctions'
import { createClient } from '@/lib/supabase/server'
import { getActiveCategories } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'

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
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  if (!category) {
    return {
      title: 'Category Not Found | FrothMonkey',
    }
  }

  const baseUrl = 'https://www.frothmonkey.com'
  const categoryUrl = `${baseUrl}/category/${params.slug}`
  const title = `${category.name} Auctions | FrothMonkey`
  const description = category.description || `Browse ${category.name} auctions on FrothMonkey. Find unique items and great deals in the ${category.name} category.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: categoryUrl,
      siteName: 'FrothMonkey',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/FrothMonkey Logo Blue.png`,
          width: 1200,
          height: 630,
          alt: `${category.name} Auctions on FrothMonkey`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/FrothMonkey Logo Blue.png`],
    },
    alternates: {
      canonical: categoryUrl,
    },
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

  // Get active listing count for this category and all subcategories
  const { count: activeListingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .in('category_id', categoryIds)
    .eq('status', 'live')

  // Get total listing count (including ended/sold for display purposes)
  const { count: totalListingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .in('category_id', categoryIds)
    .in('status', ['live', 'ended', 'sold'])
  
  // Fetch active categories for the horizontal bar
  const activeCategories = await getActiveCategories()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Horizontal Category Bar */}
      <HorizontalCategoryBar categories={activeCategories} />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {category.icon && (
                <span className="text-4xl" role="img" aria-label={category.name}>
                  {category.icon}
                </span>
              )}
              <h1 className="text-3xl font-bold">{category.name}</h1>
            </div>
            
            {category.description && (
              <p className="text-muted-foreground mb-2">
                {category.description}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground">
              {activeListingCount} active {activeListingCount === 1 ? 'auction' : 'auctions'} 
              {subcategories && subcategories.length > 0 && ' (including subcategories)'}
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

          {/* Listings Grid - shows active, or if none, shows ended/sold */}
          {activeListingCount === 0 && totalListingCount === 0 && !searchParams.q ? (
            <div>
              {/* Enhanced Empty State - Only shown if category has NEVER had listings */}
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">No auctions yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Be the first to list an item in the {category.name} category!
                </p>
                
                <div className="flex gap-3">
                  <Button asChild size="lg">
                    <Link href="/sell/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Listing
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/">
                      Browse All Categories
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Show message if no active listings but has finished ones */}
              {activeListingCount === 0 && totalListingCount > 0 && !searchParams.q && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    No active auctions in this category right now. Showing recently finished auctions below.
                  </p>
                </div>
              )}
              
              <Suspense fallback={<div>Loading auctions...</div>}>
                <ListingsGrid 
                  searchParams={{
                    ...searchParams,
                    category: params.slug,
                  }} 
                />
              </Suspense>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
