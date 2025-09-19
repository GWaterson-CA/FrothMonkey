import Link from 'next/link'
import { Search, User, Plus, Heart, Gavel, ChevronDown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUser, getUserProfile } from '@/lib/auth'
import { UserNav } from '@/components/user-nav'
import { SearchForm } from '@/components/search-form'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'

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
  const categoriesWithSubs: CategoryWithSubcategories[] = topLevelCategories?.map(category => ({
    ...category,
    subcategories: subcategories?.filter(sub => sub.parent_id === category.id) || []
  })) || []

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Gavel className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              FrothMonkey
            </span>
          </Link>

          {/* Search */}
          <div className="flex flex-1 items-center space-x-2 px-6">
            <SearchForm />
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            {user && profile ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sell/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Sell
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/watchlist">
                    <Heart className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Link>
                </Button>
                {profile.is_admin && (
                  <Button variant="ghost" size="sm" asChild>
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
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/setup-profile">Complete Profile</Link>
                </Button>
                <UserNav profile={null} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      
      {/* Category Navigation Bar */}
      <nav className="bg-muted/30 sticky top-16 z-40 dropdown-container">
        <div className="container dropdown-container relative">
          <div className="flex items-center space-x-8 py-3 overflow-x-auto dropdown-container">
            <Link 
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              All Categories
            </Link>
            {categoriesWithSubs.map((category) => (
              <div key={category.id} className="relative group">
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 whitespace-nowrap py-3 px-1 rounded-md hover:bg-muted/50"
                >
                  {category.name}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>
                
                {/* Subcategory Dropdown - Enhanced visibility */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div 
                    className="absolute top-full left-0 mt-2 min-w-[280px] bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out category-dropdown"
                    style={{
                      zIndex: 9999,
                      position: 'absolute',
                      backdropFilter: 'blur(16px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                      background: 'rgba(255, 255, 255, 0.97)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Overlay background for better contrast */}
                    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 rounded-lg -z-10"></div>
                    
                    <div className="relative py-4 max-h-[70vh] overflow-y-auto">
                      <Link
                        href={`/category/${category.slug}`}
                        className="block px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors border-b border-gray-200/60 dark:border-gray-700/60 mb-2"
                      >
                        All {category.name}
                      </Link>
                      <div className="space-y-1">
                        {category.subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/category/${subcategory.slug}`}
                            className="block px-6 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-all duration-150 rounded-none"
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
