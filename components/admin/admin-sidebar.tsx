'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  Users, 
  Package, 
  Home,
  Shield,
  Mail
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Listings', href: '/admin/listings', icon: Package },
  { name: 'Email Test', href: '/admin/email-test', icon: Mail },
  { name: 'Back to Site', href: '/', icon: Home },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      <div className="flex items-center px-6 py-4 border-b border-gray-700">
        <Shield className="w-8 h-8 text-blue-400" />
        <span className="ml-2 text-xl font-bold">Admin Panel</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">Admin Access Only</p>
      </div>
    </div>
  )
}
