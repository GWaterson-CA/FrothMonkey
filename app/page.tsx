import { Suspense } from 'react'
import { Metadata } from 'next'
import { Header } from '@/components/header'
import { ListingsGrid } from '@/components/listings-grid'
import { ListingsTabs } from '@/components/listings-tabs'
import { Hero } from '@/components/hero'
import { Footer } from '@/components/footer'

interface HomePageProps {
  searchParams: {
    q?: string
    category?: string
    sort?: string
    filter?: string
  }
}

export const metadata: Metadata = {
  title: 'FrothMonkey - Online Auction Marketplace',
  description: 'Discover amazing deals on FrothMonkey, the modern online auction marketplace. Bid on unique items, find great deals, and sell your items to a vibrant community of buyers.',
  alternates: {
    canonical: 'https://www.frothmonkey.com',
  },
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // JSON-LD structured data for the homepage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FrothMonkey',
    url: 'https://www.frothmonkey.com',
    description: 'FrothMonkey is a modern online auction marketplace for buying and selling unique items.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.frothmonkey.com/?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'FrothMonkey',
      url: 'https://www.frothmonkey.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.frothmonkey.com/FrothMonkey Logo Blue.png',
        width: 800,
        height: 600
      }
    }
  }

  const marketplaceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'FrothMonkey',
    description: 'Online auction marketplace for unique items',
    url: 'https://www.frothmonkey.com',
    currenciesAccepted: 'CAD',
    priceRange: '$$',
    paymentAccepted: 'Cash, E-Transfer, Cryptocurrency, Wire Transfer'
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketplaceJsonLd) }}
      />
      
      <Header />
      
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
