'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Package, 
  CreditCard, 
  Heart, 
  Settings, 
  User,
  BarChart3
} from 'lucide-react'

const accountNavItems = [
  {
    title: 'Overview',
    href: '/account',
    icon: BarChart3,
  },
  {
    title: 'My Listings',
    href: '/account/listings',
    icon: Package,
  },
  {
    title: 'My Bids',
    href: '/account/bids',
    icon: CreditCard,
  },
  {
    title: 'Watchlist',
    href: '/account/watchlist',
    icon: Heart,
  },
  {
    title: 'Settings',
    href: '/account/settings',
    icon: Settings,
  },
]

export function AccountSidebar() {
  const pathname = usePathname()

  return (
    <Card>
      <CardContent className="p-0">
        <nav className="space-y-1 p-2">
          {accountNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
