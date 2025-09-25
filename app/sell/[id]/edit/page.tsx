import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canEditListing } from '@/lib/listing-utils'
import { EditListingForm } from '@/components/sell/edit-listing-form'

interface EditListingPageProps {
  params: {
    id: string
  }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Fetch listing with all related data
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
      )
    `)
    .eq('id', params.id)
    .eq('owner_id', user.id) // Ensure user owns the listing
    .single()
  
  if (error || !listing) {
    notFound()
  }
  
  // Check if listing can be edited
  const editPermissions = await canEditListing(
    listing.id,
    listing.status,
    listing.start_time,
    listing.end_time
  )
  
  if (!editPermissions.canEdit) {
    redirect(`/listing/${listing.id}`)
  }
  
  // Get all categories for the category selector
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground mt-2">
            Update your auction details. Some options may be limited based on bid activity.
          </p>
        </div>
        
        <EditListingForm 
          listing={listing}
          categories={categories || []}
          editPermissions={editPermissions}
        />
      </div>
    </div>
  )
}
