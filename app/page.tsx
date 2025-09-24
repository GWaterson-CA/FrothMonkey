import { Suspense } from 'react'
import { Header } from '@/components/header'
import { ListingsGrid } from '@/components/listings-grid'
import { ListingsTabs } from '@/components/listings-tabs'
import { FilterControls } from '@/components/filter-controls'
import { Hero } from '@/components/hero'
import { Footer } from '@/components/footer'

interface HomePageProps {
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

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {!searchParams.q && (
          <Hero />
        )}
        
        <div className="container py-8">
          {searchParams.q ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">
                  Search results for "{searchParams.q}"
                </h1>
              </div>
              
              {/* Filter Controls for Search */}
              <FilterControls />
              
              <Suspense fallback={<div>Loading...</div>}>
                <ListingsGrid searchParams={searchParams} />
              </Suspense>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Featured Auctions</h1>
                <p className="text-muted-foreground">
                  Discover amazing items up for auction
                </p>
              </div>
              
              <Suspense fallback={<div>Loading...</div>}>
                <ListingsTabs />
              </Suspense>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
