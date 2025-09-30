'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, Search, ChevronRight, ChevronUp, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Tables } from '@/lib/database.types'

interface CategoryWithSubcategories extends Tables<'categories'> {
  subcategories?: Tables<'categories'>[]
}

interface MobileCategoryDialogProps {
  categories: CategoryWithSubcategories[]
}

export function MobileCategoryDialog({ categories }: MobileCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Flatten all categories and subcategories for searching
  type FlatCategory = Tables<'categories'> & { 
    isParent: boolean
    parentName?: string 
  }
  
  const allCategories: FlatCategory[] = categories.flatMap(category => {
    const items: FlatCategory[] = [{ ...category, isParent: true }]
    if (category.subcategories && category.subcategories.length > 0) {
      items.push(...category.subcategories.map(sub => ({ ...sub, isParent: false, parentName: category.name })))
    }
    return items
  })

  // Filter based on search query
  const filteredCategories = searchQuery.trim()
    ? allCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null

  const handleCategoryClick = () => {
    setOpen(false)
    setSearchQuery('')
    setExpandedCategories(new Set())
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const expandAll = () => {
    const allIds = categories.map(cat => cat.id)
    setExpandedCategories(new Set(allIds))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center">
            <Menu className="h-4 w-4 mr-2" />
            Browse Categories
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle>Browse Categories</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Expand/Collapse All Button - Only show when not searching */}
        {!searchQuery.trim() && (
          <div className="px-4 py-2 border-b bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandedCategories.size > 0 ? collapseAll : expandAll}
              className="w-full justify-center text-xs"
            >
              {expandedCategories.size > 0 ? (
                <>
                  <Minimize2 className="h-3 w-3 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3 mr-2" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Categories List */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-2">
          {filteredCategories ? (
            // Show search results
            filteredCategories.length > 0 ? (
              <div className="space-y-1">
                {filteredCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={handleCategoryClick}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{category.name}</span>
                      {category.parentName && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          in {category.parentName}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No categories found matching "{searchQuery}"
              </div>
            )
          ) : (
            // Show organized list by parent categories
            <div className="space-y-1">
              <Link
                href="/"
                onClick={handleCategoryClick}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted/80 transition-colors font-semibold border-b mb-2"
              >
                <span>All Categories</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              
              {categories.map((category) => {
                const hasSubcategories = category.subcategories && category.subcategories.length > 0
                const isExpanded = expandedCategories.has(category.id)
                
                return (
                  <div key={category.id} className="mb-2">
                    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden bg-muted/50">
                      {/* Main category link */}
                      <Link
                        href={`/category/${category.slug}`}
                        onClick={handleCategoryClick}
                        className="flex-1 flex items-center px-4 py-3 hover:bg-primary/10 transition-colors font-semibold"
                      >
                        <span className="text-base">{category.name}</span>
                      </Link>
                      
                      {/* Expand/collapse button - only show if has subcategories */}
                      {hasSubcategories && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center justify-center px-3 hover:bg-primary/10 transition-colors border-l border-muted"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Subcategories - only show when expanded */}
                    {hasSubcategories && isExpanded && (
                      <div className="mt-1 ml-4 space-y-1">
                        {category.subcategories!.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/category/${subcategory.slug}`}
                            onClick={handleCategoryClick}
                            className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-muted/80 transition-colors text-sm"
                          >
                            <span className="text-muted-foreground">{subcategory.name}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
