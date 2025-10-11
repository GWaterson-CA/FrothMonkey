import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { EditListingForm } from '@/components/sell/edit-listing-form'
import { Header } from '@/components/header'

export const metadata: Metadata = {
  title: 'Edit Listing | FrothMonkey',
  description: 'Edit your auction listing',
  robots: {
    index: false,
    follow: false,
  },
}

interface EditListingPageProps {
  params: {
    id: string
  }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const supabase = createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return <div>Please log in to edit listings</div>
  }

  // Fetch the listing with all related data
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      categories (
        id,
        name,
        slug,
        parent_id
      ),
      listing_images (
        id,
        path,
        sort_order
      ),
      bids (
        id,
        amount
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // Check if user owns this listing
  if (listing.owner_id !== profile.id) {
    notFound()
  }

  // Check if listing can be edited (not ended, cancelled, or sold)
  if (['ended', 'cancelled', 'sold'].includes(listing.status)) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Cannot Edit Listing</h1>
            <p className="text-muted-foreground">
              This listing has {listing.status === 'ended' ? 'ended' : `been ${listing.status}`} and cannot be edited.
            </p>
          </div>
        </div>
      </>
    )
  }

  // Fetch all categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  const hasBids = listing.bids && listing.bids.length > 0

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground mt-2">
            Make changes to your listing. {hasBids ? 'Some restrictions apply since bidding has started.' : ''}
          </p>
        </div>

        <EditListingForm 
          listing={listing}
          categories={categories || []}
          userId={profile.id}
          hasBids={hasBids}
        />
      </div>
    </>
  )
}
