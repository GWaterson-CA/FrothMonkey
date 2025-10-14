import { Button } from '@/components/ui/button'
import { Search, Gavel, TrendingUp, Shield, MapPin, DollarSign, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="container px-4 py-8 md:py-16 mx-auto">
        {/* Hero Content */}
        <div className="space-y-6 md:space-y-8 text-center max-w-3xl mx-auto mb-8">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl xl:text-6xl">
              Find it. Bid it.{' '}
              <span className="block text-primary">Win it.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              List for free and bid in real time on FrothMonkey: fair prices, no haggling, great deals every day.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
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

        {/* Compact Feature Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          <Link 
            href="/about" 
            className="flex flex-col items-center text-center p-4 md:p-6 rounded-lg bg-card hover:bg-accent transition-colors group"
          >
            <div className="p-2 md:p-3 rounded-full bg-primary/10 mb-2 md:mb-3">
              <Gavel className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Live Auctions</h3>
            <span className="text-xs text-primary flex items-center group-hover:underline">
              Learn more <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>

          <Link 
            href="/about" 
            className="flex flex-col items-center text-center p-4 md:p-6 rounded-lg bg-card hover:bg-accent transition-colors group"
          >
            <div className="p-2 md:p-3 rounded-full bg-primary/10 mb-2 md:mb-3">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Free to Use</h3>
            <span className="text-xs text-primary flex items-center group-hover:underline">
              Learn more <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>

          <Link 
            href="/about" 
            className="flex flex-col items-center text-center p-4 md:p-6 rounded-lg bg-card hover:bg-accent transition-colors group"
          >
            <div className="p-2 md:p-3 rounded-full bg-primary/10 mb-2 md:mb-3">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Fair Pricing</h3>
            <span className="text-xs text-primary flex items-center group-hover:underline">
              Learn more <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>

          <Link 
            href="/about" 
            className="flex flex-col items-center text-center p-4 md:p-6 rounded-lg bg-card hover:bg-accent transition-colors group"
          >
            <div className="p-2 md:p-3 rounded-full bg-primary/10 mb-2 md:mb-3">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2">Anti-Sniping</h3>
            <span className="text-xs text-primary flex items-center group-hover:underline">
              Learn more <ChevronRight className="h-3 w-3 ml-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
