'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

interface ListingImagesProps {
  images: Array<{
    id: string
    path: string
    sort_order: number | null
  }>
  coverImage: string | null
  title: string
}

export function ListingImages({ images, coverImage, title }: ListingImagesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Combine cover image and additional images
  const allImages = []
  
  if (coverImage) {
    allImages.push({ id: 'cover', path: coverImage, sort_order: -1 })
  }
  
  // Sort additional images by sort_order
  const sortedImages = [...images].sort((a, b) => 
    (a.sort_order || 0) - (b.sort_order || 0)
  )
  
  allImages.push(...sortedImages)

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-muted-foreground">No images available</p>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden group flex items-center justify-center">
        <Image
          src={getImageUrl(allImages[currentIndex].path)}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 66vw"
          priority={currentIndex === 0}
        />
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex 
                  ? 'border-primary' 
                  : 'border-transparent hover:border-muted-foreground'
              }`}
            >
              <Image
                src={getImageUrl(image.path)}
                alt={`${title} - Thumbnail ${index + 1}`}
                fill
                className="object-contain bg-muted"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
