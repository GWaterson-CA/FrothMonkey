import { getRecentlyFinishedAuctions } from '@/lib/categories'
import { ListingCard } from '@/components/listing-card'
import { Clock } from 'lucide-react'

interface RecentlyFinishedAuctionsProps {
  categoryId?: string
  limit?: number
}

export async function RecentlyFinishedAuctions({ 
  categoryId, 
  limit = 6 
}: RecentlyFinishedAuctionsProps) {
  const listings = await getRecentlyFinishedAuctions(categoryId, limit)

  if (!listings || listings.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-12 border-t">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Recently Finished Auctions</h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Check out these recently completed auctions for inspiration and pricing insights.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing: any) => (
          <ListingCard 
            key={listing.id} 
            listing={listing}
          />
        ))}
      </div>
    </div>
  )
}

