import { requireAdmin } from '@/lib/auth'
import { ListingsManagement } from '@/components/admin/listings-management'
import { Suspense } from 'react'

export default async function AdminListingsPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Listings Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all listings
        </p>
      </div>
      
      <Suspense fallback={<div>Loading listings...</div>}>
        <ListingsManagement />
      </Suspense>
    </div>
  )
}
