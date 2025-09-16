'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewForm } from './review-form'
import { ReviewsList } from './reviews-list'
import { Badge } from '@/components/ui/badge'
import { Star, Package, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PendingReview {
  transaction_id: string
  listing_title: string
  listing_id: string
  final_price: number
  created_at: string
  other_party: {
    id: string
    username: string
    role: 'seller' | 'buyer'
  }
  user_role: 'buyer' | 'seller'
}

interface ReviewsManagerProps {
  userId: string
}

export function ReviewsManager({ userId }: ReviewsManagerProps) {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReview, setActiveReview] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch('/api/reviews/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingReviews(data.pending_reviews || [])
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSuccess = (transactionId: string) => {
    setPendingReviews(prev => prev.filter(review => review.transaction_id !== transactionId))
    setActiveReview(null)
  }

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pending" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Pending Reviews
          {pendingReviews.length > 0 && (
            <Badge variant="default" className="ml-1">
              {pendingReviews.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="my-reviews" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          My Reviews
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Loading pending reviews...
              </div>
            </CardContent>
          </Card>
        ) : pendingReviews.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No pending reviews. Complete some transactions to review other users!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <Card key={review.transaction_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{review.listing_title}</CardTitle>
                      <CardDescription>
                        {formatCurrency(review.final_price)} • {review.user_role === 'buyer' ? 'You bought this item' : 'You sold this item'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {review.other_party.role === 'seller' ? 'Rate Seller' : 'Rate Buyer'}
                      </div>
                      <div className="font-medium">
                        @{review.other_party.username}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {activeReview === review.transaction_id ? (
                  <CardContent>
                    <ReviewForm
                      transactionId={review.transaction_id}
                      revieweeId={review.other_party.id}
                      revieweeUsername={review.other_party.username}
                      userRole={review.user_role}
                      otherPartyRole={review.other_party.role}
                      listingTitle={review.listing_title}
                      finalPrice={review.final_price}
                      onSuccess={() => handleReviewSuccess(review.transaction_id)}
                    />
                  </CardContent>
                ) : (
                  <CardContent>
                    <button
                      onClick={() => setActiveReview(review.transaction_id)}
                      className="w-full text-left p-4 border border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>Click to review @{review.other_party.username}</span>
                      </div>
                    </button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="my-reviews" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Reviews About You
            </CardTitle>
            <CardDescription>
              See what other users have said about their experience with you.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <ReviewsList userId={userId} username="You" />
      </TabsContent>
    </Tabs>
  )
}
