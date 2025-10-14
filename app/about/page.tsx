import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Gavel, DollarSign, TrendingUp, Shield, Clock, Users, MapPin, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About FrothMonkey - How Our Auctions Work',
  description: 'Learn how FrothMonkey auctions work, including our anti-sniping protection, free listings, fair pricing, and more. Discover why our marketplace is different.',
  alternates: {
    canonical: 'https://www.frothmonkey.com/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12 md:py-16">
          <div className="container px-4 mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              About FrothMonkey
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your local online auction marketplace, built for Squamish
            </p>
          </div>
        </section>

        {/* How Auctions Work */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gavel className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">How Auctions Work</h2>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                <p className="text-lg text-muted-foreground">
                  FrothMonkey makes buying and selling simple, fair, and exciting.
                </p>
                
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    For Buyers
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Browse active auctions and place bids in real-time</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Receive instant notifications when you're outbid</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Win items at fair market prices determined by true demand</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Arrange pickup or delivery directly with the seller after winning</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    For Sellers
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>List items for free - no listing fees or hidden costs</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Set a starting price and optional reserve price</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Choose when your auction ends, time and date</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Add a "Buy Now" price for an immediate sale</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Track bids in real-time and communicate with the winner</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Anti-Sniping Protection */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Anti-Sniping Protection</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  We protect both buyers and sellers from last-second bidding tactics.
                </p>
                
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-4">How It Works</h3>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      When a bid is placed in the final <strong className="text-foreground">5 minutes</strong> of an auction, 
                      we automatically extend the auction by <strong className="text-foreground">5 more minutes</strong>.
                    </p>
                    <p>
                      This ensures that all interested buyers have a fair chance to respond to new bids, 
                      and auctions end at true market value—not because someone waited until the last second.
                    </p>
                    <p>
                      The auction only ends when there are no new bids in the final 5 minutes.
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Why This Matters
                  </h3>
                  <p className="text-muted-foreground">
                    Traditional online auctions can be won by "snipers" who place bids in the final seconds, 
                    giving no one else time to respond. Our anti-sniping system ensures fair competition 
                    and better prices for sellers while giving buyers confidence they won't lose to a last-second bid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Listings & Fair Pricing */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Free Listings & Fair Pricing</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-4">Completely Free to List</h3>
                  <p className="text-muted-foreground mb-4">
                    Unlike other platforms, we charge <strong className="text-foreground">zero listing fees</strong>. 
                    Create as many listings as you want without paying a cent.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>No insertion fees</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>No subscription required</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>No hidden costs</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>No final value fees</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Market-Driven Fair Pricing
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Auctions naturally find the fair market price through competitive bidding. 
                    No haggling, no price negotiations - just transparent, competitive pricing.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="p-4 bg-muted/50 rounded">
                      <p className="font-semibold mb-1">Reserve Prices (Buyers)</p>
                      <p className="text-muted-foreground">
                        Set a minimum price you're willing to accept. If bidding doesn't reach your reserve, 
                        you're not obligated to sell. Note: If your listing doesn't reach your reserve price, you have the option to reach out to the highest bidder to negotiate, or reslit and start the auction again.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded">
                      <p className="font-semibold mb-1">Buy Now Option</p>
                      <p className="text-muted-foreground">
                        Want to sell faster? Add a "Buy Now" price that lets buyers purchase immediately 
                        without waiting for the auction to end. Note: Once a listing reaches the Reserve Price, the Buy Now option is no longer available. 
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Focus */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Built for Squamish</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  FrothMonkey is exclusively serving the Squamish community, connecting local buyers 
                  and sellers for convenient, face-to-face transactions.
                </p>
                
                <div className="bg-card p-6 rounded-lg border">
                  <h3 className="text-xl font-semibold mb-4">Why Local Matters</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>No shipping costs or delays</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Inspect items in person before purchasing</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Support your local community</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Easy pickup and drop-off arrangements</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Build trust with local buyers and sellers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the FrothMonkey community today. Start bidding on great deals or list your items for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/">
                  Browse Auctions
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/sell/new">
                  Create a Listing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}

