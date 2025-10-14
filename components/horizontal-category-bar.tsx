'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { CategoryWithSubcategories } from '@/lib/categories'

interface HorizontalCategoryBarProps {
  categories: CategoryWithSubcategories[]
}

export function HorizontalCategoryBar({ categories }: HorizontalCategoryBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Check if we can scroll
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 10)
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 300
    const newScrollPosition = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    })
  }

  // Get current category from URL
  const currentCategory = pathname.startsWith('/category/') 
    ? pathname.split('/category/')[1] 
    : null

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="relative border-b bg-background">
      {/* Left scroll button */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-12 bg-gradient-to-r from-background to-transparent hover:from-muted/50 transition-colors"
          aria-label="Scroll left"
        >
          <div className="w-7 h-7 rounded-full border bg-background shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
            <ChevronLeft className="h-4 w-4" />
          </div>
        </button>
      )}

      {/* Categories scroll container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto hide-scrollbar scroll-smooth"
      >
        <div className="container">
          <div className="flex items-center gap-2 py-4 px-2">
            {/* All Categories link */}
            <Link
              href="/"
              className={cn(
                "flex flex-col items-center justify-between gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0",
                "hover:bg-muted/50 min-w-[80px] w-[80px]",
                !currentCategory && !searchParams.get('category')
                  ? "bg-muted border border-border shadow-sm"
                  : "hover:border hover:border-border/50"
              )}
            >
              <span className="text-2xl">🏡</span>
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                !currentCategory && !searchParams.get('category')
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}>
                All
              </span>
              {!currentCategory && !searchParams.get('category') && (
                <div className="h-0.5 w-full bg-primary rounded-full" />
              )}
            </Link>

            {/* Category items */}
            {categories.map((category) => {
              const isActive = currentCategory === category.slug || 
                              searchParams.get('category') === category.slug
              
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className={cn(
                    "flex flex-col items-center justify-between gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0",
                    "hover:bg-muted/50 min-w-[80px] w-[80px]",
                    isActive
                      ? "bg-muted border border-border shadow-sm"
                      : "hover:border hover:border-border/50"
                  )}
                >
                  {/* Icon */}
                  <span className="text-2xl" role="img" aria-label={category.name}>
                    {category.icon || '📦'}
                  </span>
                  
                  {/* Category name */}
                  <span className={cn(
                    "text-xs font-medium text-center leading-tight",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {category.name}
                  </span>
                  
                  {/* Count badge - subtle */}
                  {category.active_listing_count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {category.active_listing_count}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="h-0.5 w-full bg-primary rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-12 bg-gradient-to-l from-background to-transparent hover:from-muted/50 transition-colors"
          aria-label="Scroll right"
        >
          <div className="w-7 h-7 rounded-full border bg-background shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

