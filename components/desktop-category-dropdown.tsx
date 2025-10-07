'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tables } from '@/lib/database.types'

interface CategoryWithSubcategories extends Tables<'categories'> {
  subcategories?: Tables<'categories'>[]
}

interface DesktopCategoryDropdownProps {
  categories: CategoryWithSubcategories[]
}

export function DesktopCategoryDropdown({ categories }: DesktopCategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const handleCategoryClick = () => {
    setOpen(false)
    setHoveredCategory(null)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-background hover:bg-muted/80 border-border"
        >
          <Menu className="h-4 w-4" />
          Categories
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[600px] max-h-[600px] p-0" 
        align="start"
        sideOffset={8}
      >
        <div className="grid grid-cols-[280px_1fr] h-full">
          {/* Left Panel - Main Categories */}
          <div className="border-r bg-muted/30 overflow-y-auto">
            <Link
              href="/"
              onClick={handleCategoryClick}
              className="flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors border-b sticky top-0 bg-muted/30 backdrop-blur-sm z-10"
            >
              All Categories
              <ChevronRight className="h-4 w-4" />
            </Link>
            <div className="py-1">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  className={`transition-colors ${
                    hoveredCategory === category.id ? 'bg-muted' : ''
                  }`}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={handleCategoryClick}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/80 transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Subcategories */}
          <div className="bg-background overflow-y-auto">
            {hoveredCategory ? (
              (() => {
                const category = categories.find(cat => cat.id === hoveredCategory)
                if (!category) return null
                
                if (!category.subcategories || category.subcategories.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground px-4">
                      No subcategories available
                    </div>
                  )
                }

                return (
                  <div className="py-1">
                    <div className="px-4 py-3 border-b bg-muted/20 sticky top-0 backdrop-blur-sm">
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                    </div>
                    <div className="py-1">
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/category/${subcategory.slug}`}
                          onClick={handleCategoryClick}
                          className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          {subcategory.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Menu className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Hover over a category to view subcategories
                </p>
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

