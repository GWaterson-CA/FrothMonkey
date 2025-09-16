import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/lib/database.types'

interface CategoryNavProps {
  categories: Tables<'categories'>[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav className="border-b bg-muted/30">
      <div className="container">
        <div className="flex items-center space-x-6 py-3 overflow-x-auto">
          <Link 
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            All Categories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
