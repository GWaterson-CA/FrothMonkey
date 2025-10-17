import { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { FloatingCircles } from '@/components/floating-circles'

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
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Floating circles background */}
      <FloatingCircles />
      
      <AdminSidebar />
      <main className="flex-1 relative z-10">{children}</main>
    </div>
  )
}
