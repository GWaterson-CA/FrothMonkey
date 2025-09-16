import { Suspense } from 'react'
import { Header } from '@/components/header'
import { CategoryNav } from '@/components/category-nav'
import { ListingsGrid } from '@/components/listings-grid'
import { ListingsTabs } from '@/components/listings-tabs'
import { Hero } from '@/components/hero'
import { Footer } from '@/components/footer'
import { createClient } from '@/lib/supabase/server'

interface HomePageProps {
  searchParams: {
    q?: string
    category?: string
    sort?: string
    filter?: string
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = createClient()
  
  // Fetch categories for navigation
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CategoryNav categories={categories || []} />
      
      <main className="flex-1">
        {!searchParams.q && (
          <Hero />
        )}
        
        <div className="container py-8">
          {searchParams.q ? (
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                Search results for "{searchParams.q}"
              </h1>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Featured Auctions</h1>
              <p className="text-muted-foreground">
                Discover amazing items up for auction
              </p>
            </div>
          )}

          <Suspense fallback={<div>Loading...</div>}>
            {searchParams.q ? (
              <ListingsGrid searchParams={searchParams} />
            ) : (
              <ListingsTabs />
            )}
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
