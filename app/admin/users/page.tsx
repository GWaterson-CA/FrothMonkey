import { requireAdmin } from '@/lib/auth'
import { UsersManagement } from '@/components/admin/users-management'
import { Suspense } from 'react'

export default async function AdminUsersPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all users
        </p>
      </div>
      
      <Suspense fallback={<div>Loading users...</div>}>
        <UsersManagement />
      </Suspense>
    </div>
  )
}
