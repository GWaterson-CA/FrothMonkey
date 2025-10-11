import { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect to home if not admin
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
