import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { ReviewsManager } from '@/components/reviews/reviews-manager'

export const metadata: Metadata = {
  title: 'Reviews | FrothMonkey',
  description: 'Manage your reviews and ratings',
}

export default async function ReviewsPage() {
  const user = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">
          Review your completed transactions and manage your ratings.
        </p>
      </div>

      <ReviewsManager userId={user.id} />
    </div>
  )
}
