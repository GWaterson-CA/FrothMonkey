'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { StarRating } from './star-rating'
import { Loader2, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  comment: z.string().optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  transactionId: string
  revieweeId: string
  revieweeUsername: string
  userRole: 'buyer' | 'seller'
  otherPartyRole: 'buyer' | 'seller'
  listingTitle: string
  finalPrice: number
  onSuccess?: () => void
}

export function ReviewForm({
  transactionId,
  revieweeId,
  revieweeUsername,
  userRole,
  otherPartyRole,
  listingTitle,
  finalPrice,
  onSuccess
}: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  })

  const rating = watch('rating') || 0

  const onSubmit = async (data: ReviewFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          reviewee_id: revieweeId,
          rating: data.rating,
          comment: data.comment?.trim()
        })
      })

      if (response.ok) {
        toast({
          title: 'Review submitted',
          description: `Your review for @${revieweeUsername} has been posted successfully.`,
        })
        onSuccess?.()
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit review',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Review {otherPartyRole === 'seller' ? 'Seller' : 'Buyer'}
        </CardTitle>
        <CardDescription>
          Rate your experience with @{revieweeUsername} for "{listingTitle}" ({formatCurrency(finalPrice)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <Label>Rating</Label>
            <div className="flex items-center gap-2">
              <StarRating 
                rating={rating}
                interactive
                size="lg"
                onRatingChange={(newRating) => setValue('rating', newRating)}
              />
              <span className="text-sm text-muted-foreground ml-2">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
            {errors.rating && (
              <p className="text-sm text-destructive">{errors.rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder={`Share your experience working with @${revieweeUsername}...`}
              rows={4}
              {...register('comment')}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading || rating === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
