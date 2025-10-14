import Link from 'next/link'
import { User, Plus, Heart, Shield } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getUser, getUserProfile } from '@/lib/auth'
import { UserNav } from '@/components/user-nav'
import { SearchForm } from '@/components/search-form'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import { MobileCategoryNav } from '@/components/mobile-category-nav'
import { DesktopCategoryDropdown } from '@/components/desktop-category-dropdown'
import { MobileSearchDialog } from '@/components/mobile-search-dialog'
import { getActiveCategories } from '@/lib/categories'

export async function Header() {
  const user = await getUser()
  const profile = user ? await getUserProfile() : null
  
  // Fetch categories with active listings only (for navigation)
  const categoriesWithSubs = await getActiveCategories()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-2 md:gap-4">
          {/* Logo - Always visible */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image 
              src="/FrothMonkey Logo Blue.png" 
              alt="FrothMonkey Logo" 
              width={128} 
              height={128}
              className="h-7 w-auto md:h-8"
              priority
              quality={100}
            />
          </Link>

          {/* Spacer to push content to the right */}
          <div className="flex-1" />

          {/* Search - Hidden on small screens, shown on md+ */}
          <div className="hidden md:flex items-center">
            <SearchForm />
          </div>

          {/* Desktop Category Dropdown - Next to search bar */}
          <div className="hidden md:block">
            <DesktopCategoryDropdown categories={categoriesWithSubs} />
          </div>

          {/* Navigation - Compact on mobile */}
          <nav className="flex items-center gap-1 md:gap-2">
            {/* Mobile Search Icon */}
            <MobileSearchDialog />
            
            {user && profile ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/sell/new">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sell</span>
                  </Link>
                </Button>
                <NotificationsDropdown />
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link href="/account/watchlist">
                    <Heart className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
                  <Link href="/account">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Link>
                </Button>
                {profile.is_admin && (
                  <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <UserNav profile={profile} />
              </>
            ) : user && !profile ? (
              <>
                <Button variant="default" size="sm" asChild>
                  <Link href="/auth/setup-profile">
                    Complete Profile
                  </Link>
                </Button>
                <UserNav profile={null} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">
                    <span className="hidden sm:inline">Sign In</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      
      {/* Category Navigation Bar - Mobile Only with scroll behavior */}
      <MobileCategoryNav categories={categoriesWithSubs} />
    </>
  )
}
