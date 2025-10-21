'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Bid {
  id: number
  amount: number
  created_at: string
  is_auto_bid: boolean
  profiles: {
    username: string | null
  } | null
}

interface BidHistoryProps {
  listingId: string
  initialBids: Bid[]
}

export function BidHistory({ listingId, initialBids }: BidHistoryProps) {
  const [bids, setBids] = useState<Bid[]>(initialBids)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      // Subscribe to new bids for this listing
      channel = supabase
        .channel(`bids:listing_id=eq.${listingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bids',
            filter: `listing_id=eq.${listingId}`,
          },
          async (payload) => {
            // Fetch the new bid with profile information
            const { data: newBid } = await supabase
              .from('bids')
              .select(`
                *,
                profiles (
                  username
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (newBid) {
              // Add new bid and re-sort by amount (desc), then created_at (asc)
              setBids((prevBids) => {
                const updated = [newBid, ...prevBids]
                return updated
                  .sort((a, b) => {
                    if (b.amount !== a.amount) {
                      return b.amount - a.amount // Higher amount first
                    }
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime() // Earlier time first for ties
                  })
                  .slice(0, 20)
              })
            }
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [listingId, supabase])

  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No bids yet. Be the first to bid!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Bid History
          <Badge variant="secondary">{bids.length} bid{bids.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {bids.map((bid, index) => (
            <div
              key={bid.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {index === 0 ? '🏆' : index + 1}
                </div>
                <div>
                  <div className="font-medium">
                    @{bid.profiles?.username || 'Unknown'}
                    {bid.is_auto_bid && (
                      <span className="text-xs text-muted-foreground ml-2 font-normal">
                        (Auto-bid)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {formatRelativeTime(bid.created_at)}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-semibold ${
                index === 0 ? 'text-primary' : ''
              }`}>
                {formatCurrency(bid.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
