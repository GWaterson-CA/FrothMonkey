import Link from 'next/link'
import { User, Plus, Heart, Shield } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getUser, getUserProfile } from '@/lib/auth'
import { UserNav } from '@/components/user-nav'
import { SearchForm } from '@/components/search-form'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'
import { MobileCategoryDialog } from '@/components/mobile-category-dialog'
import { DesktopCategoryDropdown } from '@/components/desktop-category-dropdown'

interface CategoryWithSubcategories extends Tables<'categories'> {
  subcategories?: Tables<'categories'>[]
}

export async function Header() {
  const user = await getUser()
  const profile = user ? await getUserProfile() : null
  
  const supabase = createClient()
  
  // Fetch top-level categories (no parent_id)
  const { data: topLevelCategories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order')
  
  // Fetch all subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .not('parent_id', 'is', null)
    .order('sort_order')
  
  // Group subcategories by parent
  const categoriesWithSubs: CategoryWithSubcategories[] = (topLevelCategories as Tables<'categories'>[] || []).map((category: Tables<'categories'>) => {
    const categoryId = category.id
    const subs = (subcategories as Tables<'categories'>[] || []).filter((sub: Tables<'categories'>) => sub.parent_id === categoryId)
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order,
      parent_id: category.parent_id,
      subcategories: subs
    }
  })

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

          {/* Search - Hidden on small screens, shown on md+ */}
          <div className="hidden md:flex flex-1 items-center px-2 lg:px-6">
            <SearchForm />
          </div>

          {/* Navigation - Compact on mobile */}
          <nav className="flex items-center gap-1 md:gap-2 ml-auto">
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

        {/* Mobile Search Bar - Shown on small screens only */}
        <div className="md:hidden border-t">
          <div className="container py-2">
            <SearchForm />
          </div>
        </div>
      </header>
      
      {/* Category Navigation Bar */}
      <nav className="bg-muted/30 sticky top-16 z-40 border-b">
        <div className="container py-3">
          {/* Mobile Category Dialog - Shown on small screens */}
          <div className="md:hidden">
            <MobileCategoryDialog categories={categoriesWithSubs} />
          </div>

          {/* Desktop Category Dropdown - Hidden on small screens */}
          <div className="hidden md:block">
            <DesktopCategoryDropdown categories={categoriesWithSubs} />
          </div>
        </div>
      </nav>
    </>
  )
}
