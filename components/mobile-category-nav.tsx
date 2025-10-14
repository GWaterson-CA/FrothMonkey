'use client'

import { useState, useEffect } from 'react'
import { MobileCategoryDialog } from '@/components/mobile-category-dialog'
import type { Tables } from '@/lib/database.types'

interface CategoryWithSubcategories extends Tables<'categories'> {
  subcategories?: Tables<'categories'>[]
}

interface MobileCategoryNavProps {
  categories: CategoryWithSubcategories[]
}

export function MobileCategoryNav({ categories }: MobileCategoryNavProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // If at the very top, always show
      if (currentScrollY < 10) {
        setIsVisible(true)
      }
      // If scrolling down and past the header, hide
      else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
      }
      // If scrolling up, show
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  return (
    <nav 
      className={`bg-muted/30 sticky top-16 z-40 border-b md:hidden transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container py-3">
        <MobileCategoryDialog categories={categories} />
      </div>
    </nav>
  )
}

