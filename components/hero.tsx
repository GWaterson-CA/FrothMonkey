import { Button } from '@/components/ui/button'
import { Search, Gavel, TrendingUp, Shield, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="container px-4 py-16 mx-auto">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                Find it. Bid it.{' '}
                <span className="block text-primary">Win it.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
              List for free and bid in real time on FrothMonkey: fair prices, no haggling, great deals every day.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="#featured">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Auctions
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/sell/new">
                  <Gavel className="mr-2 h-5 w-5" />
                  Start Selling
                </Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <Gavel className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Live Auctions</h3>
              <p className="text-sm text-muted-foreground">
                Real-time bidding with instant updates and anti-sniping protection
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Free to Use</h3>
              <p className="text-sm text-muted-foreground">
                No listing fees, no hidden costs - just pure auction excitement
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Fair Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Market-driven prices with reserve options and Buy Now features
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Exclusive to Squamish</h3>
              <p className="text-sm text-muted-foreground">
                Built exclusively for Squamish - and right now this is just for Squamish sellers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
