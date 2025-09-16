'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarRating, UserRatingDisplay } from './star-rating'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { User, Package } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    username: string
  }
  transaction: {
    id: string
    final_price: number
    listing: {
      title: string
    }
  }
}

interface RatingSummary {
  average_rating: number
  review_count: number
}

interface ReviewsListProps {
  userId: string
  username: string
  limit?: number
}

export function ReviewsList({ userId, username, limit = 20 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetchReviews(0)
  }, [userId])

  const fetchReviews = async (currentOffset: number = 0) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/reviews?user_id=${userId}&limit=${limit}&offset=${currentOffset}`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (currentOffset === 0) {
          setReviews(data.reviews)
          setRatingSummary(data.rating_summary)
        } else {
          setReviews(prev => [...prev, ...data.reviews])
        }
        
        setHasMore(data.has_more)
        setOffset(currentOffset + data.reviews.length)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    fetchReviews(offset)
  }

  if (loading && reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading reviews...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ratingSummary && reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              @{username} hasn't received any reviews yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      {ratingSummary && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">@{username}'s Rating</h3>
              <UserRatingDisplay
                rating={ratingSummary.average_rating}
                reviewCount={ratingSummary.review_count}
                size="lg"
                className="justify-center"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm font-medium">
                        by @{review.reviewer.username}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(review.created_at)}
                    </div>
                  </div>
                </div>

                {/* Transaction Context */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
                  <Package className="h-3 w-3" />
                  <span>{review.transaction.listing.title}</span>
                  <span>•</span>
                  <span>{formatCurrency(review.transaction.final_price)}</span>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More Reviews'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
