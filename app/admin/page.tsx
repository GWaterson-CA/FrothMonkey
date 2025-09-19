import { requireAdmin } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { Suspense } from 'react'

export default async function AdminPage() {
  // This will redirect to home if not admin
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, listings, and view analytics
        </p>
      </div>
      
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg border animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}
