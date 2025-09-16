'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, index) => index + 1)
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const isFilled = star <= rating
        const isPartial = star - 0.5 <= rating && star > rating
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={!interactive}
            className={cn(
              "relative",
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"
            )}
          >
            <Star 
              className={cn(
                sizeClasses[size],
                isFilled || isPartial 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-muted text-muted-foreground"
              )}
            />
            {isPartial && (
              <Star 
                className={cn(
                  sizeClasses[size],
                  "absolute inset-0 fill-yellow-400 text-yellow-400"
                )}
                style={{
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

interface UserRatingDisplayProps {
  rating: number
  reviewCount: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserRatingDisplay({ 
  rating, 
  reviewCount, 
  showCount = true, 
  size = 'md',
  className 
}: UserRatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating rating={rating} size={size} />
      <span className={cn(
        "font-medium",
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      )}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span className={cn(
          "text-muted-foreground",
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
        )}>
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}
