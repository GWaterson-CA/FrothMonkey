import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingCircles } from '@/components/floating-circles'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { requireProfile } from '@/lib/auth'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated and has a profile
  await requireProfile()

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating circles background */}
      <FloatingCircles />
      
      <Header />
      
      <div className="flex-1 container py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <AccountSidebar />
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            {children}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
