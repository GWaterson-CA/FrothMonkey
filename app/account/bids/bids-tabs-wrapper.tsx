'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Trophy, X, Eye, Users } from 'lucide-react'
import { ContactExchangeCard } from '@/components/account/contact-exchange-card'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CountdownTimer } from '@/components/countdown-timer'

interface BidsTabsWrapperProps {
  activeBids: any[]
  outbidBids: any[]
  wonBids: any[]
  lostBids: any[]
  contactExchanges: any[]
  profileId: string
}

const BidCard = ({ bid, status }: { bid: any; status: 'active' | 'outbid' | 'won' | 'lost' }) => {
  const totalBids = bid.totalBids || 1
  return (
    <Card key={`${bid.listings.id}-${status}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{bid.listings.title}</h3>
              <Badge
                variant={
                  status === 'active'
                    ? 'success'
                    : status === 'won'
                    ? 'default'
                    : status === 'outbid'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {status === 'active' ? 'Winning' : 
                 status === 'won' ? 'Won' :
                 status === 'outbid' ? 'Outbid' : 'Lost'}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Category: {bid.listings.categories?.name || 'Unknown'}</div>
              <div>Your bid: {formatCurrency(bid.amount)}</div>
              <div>Current price: {formatCurrency(bid.listings.current_price)}</div>
              <div>Total bids: {totalBids}</div>
              
              {bid.listings.status === 'live' ? (
                <div className="flex items-center gap-2">
                  <span>Ends:</span>
                  <CountdownTimer endTime={bid.listings.end_time} />
                </div>
              ) : (
                <div>Ended: {formatDateTime(bid.listings.end_time)}</div>
              )}
              
              <div>Bid placed: {formatDateTime(bid.created_at)}</div>
            </div>

            {status === 'won' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Congratulations! You won this auction.
                  </span>
                </div>
              </div>
            )}

            {status === 'outbid' && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You've been outbid by {formatCurrency(bid.listings.current_price - bid.amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/listing/${bid.listings.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BidsTabsWrapper({
  activeBids,
  outbidBids,
  wonBids,
  lostBids,
  contactExchanges,
  profileId,
}: BidsTabsWrapperProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'active')

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="active">
          Active ({activeBids.length})
        </TabsTrigger>
        <TabsTrigger value="outbid">
          Outbid ({outbidBids.length})
        </TabsTrigger>
        <TabsTrigger value="won">
          Won ({wonBids.length})
        </TabsTrigger>
        <TabsTrigger value="lost">
          Lost ({lostBids.length})
        </TabsTrigger>
        <TabsTrigger value="contacts">
          Contact Exchanges ({contactExchanges.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4 mt-6">
        {activeBids.length > 0 ? (
          activeBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="active" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No active bids</p>
                <p className="text-sm">Bids where you're currently winning will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="outbid" className="space-y-4 mt-6">
        {outbidBids.length > 0 ? (
          outbidBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="outbid" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <X className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No outbid items</p>
                <p className="text-sm">Items where you've been outbid will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="won" className="space-y-4 mt-6">
        {wonBids.length > 0 ? (
          wonBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="won" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No won auctions</p>
                <p className="text-sm">Auctions you've won will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="lost" className="space-y-4 mt-6">
        {lostBids.length > 0 ? (
          lostBids.map((bid) => (
            <BidCard key={bid.id} bid={bid} status="lost" />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <X className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No lost auctions</p>
                <p className="text-sm">Auctions you didn't win will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4 mt-6">
        {contactExchanges.length > 0 ? (
          contactExchanges.map((contact: any) => (
            <ContactExchangeCard
              key={contact.id}
              contact={contact}
              currentUserId={profileId}
              role="buyer"
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No contact exchanges</p>
                <p className="text-sm">When auctions you bid on end, contact exchanges will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

