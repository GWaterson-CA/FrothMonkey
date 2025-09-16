import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Package, CreditCard, Heart, TrendingUp, DollarSign } from 'lucide-react'

export default async function AccountOverviewPage() {
  const profile = await getUserProfile()
  const supabase = createClient()

  if (!profile) {
    return <div>Profile not found</div>
  }

  // Fetch user statistics
  const [
    { count: totalListings },
    { count: activeListings },
    { count: totalBids },
    { count: watchlistCount },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profile.id),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', profile.id)
      .eq('status', 'live'),
    supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('bidder_id', profile.id),
    supabase
      .from('watchlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id),
  ])

  // Fetch recent activity
  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, title, status, current_price, created_at')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentBids } = await supabase
    .from('bids')
    .select(`
      id,
      amount,
      created_at,
      listings!bids_listing_id_fkey (
        id,
        title,
        status
      )
    `)
    .eq('bidder_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total Listings',
      value: totalListings || 0,
      icon: Package,
      description: 'Items you\'ve listed',
    },
    {
      title: 'Active Auctions',
      value: activeListings || 0,
      icon: TrendingUp,
      description: 'Currently live',
    },
    {
      title: 'Bids Placed',
      value: totalBids || 0,
      icon: CreditCard,
      description: 'Your bid history',
    },
    {
      title: 'Watchlist Items',
      value: watchlistCount || 0,
      icon: Heart,
      description: 'Items you\'re watching',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your auction activity.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentListings && recentListings.length > 0 ? (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <div className="font-medium">{listing.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(listing.current_price)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        listing.status === 'live'
                          ? 'success'
                          : listing.status === 'sold'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {listing.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No listings yet. Start selling to see them here!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBids && recentBids.length > 0 ? (
              <div className="space-y-3">
                {recentBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <div className="font-medium">
                        {bid.listings?.title || 'Unknown Item'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bid: {formatCurrency(bid.amount)}
                      </div>
                    </div>
                    <Badge
                      variant={
                        bid.listings?.status === 'live'
                          ? 'success'
                          : bid.listings?.status === 'sold'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {bid.listings?.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No bids yet. Start bidding to see them here!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
