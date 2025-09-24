'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, AlertCircle, MessageCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ContactHighestBidderButton } from '@/components/messaging/contact-highest-bidder-button'

interface AuctionResultsProps {
  listing: {
    id: string
    title: string
    status: string
    current_price: number
    start_price: number
    reserve_price?: number
    reserve_met: boolean
    end_time: string
    owner_id: string
  }
  highestBid?: {
    id: string
    amount: number
    created_at: string
    profiles: {
      id: string
      username: string
    }
  }
  currentUserId?: string
}

export function AuctionResults({ listing, highestBid, currentUserId }: AuctionResultsProps) {
  const isOwner = currentUserId === listing.owner_id
  const hasBids = highestBid !== undefined
  const reserveNotMet = listing.reserve_price && !listing.reserve_met

  if (listing.status === 'live') {
    return null // Don't show results for live auctions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {listing.status === 'sold' ? (
            <>
              <Trophy className="h-5 w-5 text-primary" />
              Auction Sold
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Auction Ended
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Final Price */}
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(listing.current_price)}
          </div>
          <div className="text-sm text-muted-foreground">
            Final Price
          </div>
        </div>

        {/* Auction Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Starting Price:</span>
            <span>{formatCurrency(listing.start_price)}</span>
          </div>
          
          {listing.reserve_price && (
            <div className="flex justify-between">
              <span>Reserve Price:</span>
              <span className={reserveNotMet ? 'text-destructive' : 'text-green-600'}>
                {formatCurrency(listing.reserve_price)}
                {reserveNotMet ? ' (Not Met)' : ' (Met)'}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Ended:</span>
            <span>{formatDateTime(listing.end_time)}</span>
          </div>
        </div>

        {/* Results */}
        {listing.status === 'sold' && hasBids ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Auction Successful</span>
            </div>
            <p className="text-sm text-green-700">
              The auction sold for {formatCurrency(listing.current_price)} to @{highestBid.profiles.username}.
            </p>
          </div>
        ) : hasBids && reserveNotMet ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Reserve Not Met</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              The highest bid of {formatCurrency(listing.current_price)} did not meet the reserve price of {formatCurrency(listing.reserve_price!)}.
            </p>
            {isOwner && (
              <div className="space-y-2">
                <p className="text-sm text-yellow-700">
                  You can contact the highest bidder to discuss the item:
                </p>
                <ContactHighestBidderButton
                  listingId={listing.id}
                  highestBidderId={highestBid.profiles.id}
                  currentUserId={currentUserId!}
                  size="sm"
                />
              </div>
            )}
          </div>
        ) : hasBids ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-800">Auction Ended</span>
            </div>
            <p className="text-sm text-gray-700">
              The auction ended with a final bid of {formatCurrency(listing.current_price)} from @{highestBid.profiles.username}.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-800">No Bids</span>
            </div>
            <p className="text-sm text-gray-700">
              This auction ended with no bids. Consider relisting with different pricing or terms.
            </p>
          </div>
        )}

        {/* Winner Information */}
        {hasBids && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Highest Bidder</h4>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {highestBid.profiles.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">@{highestBid.profiles.username}</div>
                <div className="text-sm text-muted-foreground">
                  Bid: {formatCurrency(highestBid.amount)} • {formatDateTime(highestBid.created_at)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
