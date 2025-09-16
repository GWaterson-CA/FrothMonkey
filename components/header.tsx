import Link from 'next/link'
import { Search, User, Plus, Heart, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUser, getUserProfile } from '@/lib/auth'
import { UserNav } from '@/components/user-nav'
import { SearchForm } from '@/components/search-form'

export async function Header() {
  const user = await getUser()
  const profile = user ? await getUserProfile() : null

  return (
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
  )
}
