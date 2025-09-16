import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { requireProfile } from '@/lib/auth'
import { CreateListingForm } from '@/components/sell/create-listing-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Create New Listing | FrothMonkey',
  description: 'Create a new auction listing',
}

export default async function NewListingPage() {
  const profile = await requireProfile()
  const supabase = createClient()

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Create New Listing</h1>
              <p className="text-muted-foreground">
                List your item for auction and reach thousands of potential buyers.
              </p>
            </div>

            <CreateListingForm 
              categories={categories || []}
              userId={profile.id}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
