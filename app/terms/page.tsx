import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Terms of Service | FrothMonkey',
  description: 'Read FrothMonkey\'s Terms of Service to understand the rules, policies, and guidelines for using our online auction marketplace platform.',
  alternates: {
    canonical: 'https://www.frothmonkey.com/terms',
  },
  openGraph: {
    title: 'Terms of Service | FrothMonkey',
    description: 'Read FrothMonkey\'s Terms of Service to understand the rules and policies for using our auction marketplace.',
    url: 'https://www.frothmonkey.com/terms',
    siteName: 'FrothMonkey',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
              {/* Agreement to Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Agreement to Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    By accessing and using FrothMonkey ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                  <p>
                    FrothMonkey is an online auction marketplace that connects buyers and sellers. These Terms of Service ("Terms") govern your use of our website and services.
                  </p>
                </CardContent>
              </Card>

              {/* User Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle>2. User Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    You must create an account to participate in auctions. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Providing accurate and complete information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                  </ul>
                  <p>
                    You must be at least 18 years old to create an account and participate in auctions.
                  </p>
                </CardContent>
              </Card>

              {/* Auction Rules */}
              <Card>
                <CardHeader>
                  <CardTitle>3. Auction Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">Bidding</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All bids are binding and cannot be retracted</li>
                    <li>You agree to purchase the item if you are the highest bidder</li>
                    <li>Reserve prices may apply and will be disclosed when met</li>
                    <li>Anti-sniping protection may extend auction end times</li>
                  </ul>
                  
                  <h4 className="font-semibold">Buy Now</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Buy Now allows immediate purchase at a fixed price</li>
                    <li>Buy Now is disabled once reserve price is reached</li>
                    <li>Buy Now purchases are final and binding</li>
                  </ul>

                  <h4 className="font-semibold">Listing Items</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must own the items you list for auction</li>
                    <li>Descriptions must be accurate and complete</li>
                    <li>You cannot cancel auctions with active bids</li>
                    <li>You agree to sell to the highest bidder (if reserve is met)</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Payment and Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Payment and Transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    FrothMonkey facilitates transactions between users but does not process payments directly. Payment arrangements are between buyers and sellers.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Payment must be arranged within 48 hours of auction end</li>
                    <li>Sellers are responsible for item delivery and condition</li>
                    <li>Disputes should be resolved between parties first</li>
                    <li>FrothMonkey may assist in dispute resolution but is not responsible for transaction outcomes</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Prohibited Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Prohibited Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                    <li>List illegal, stolen, or counterfeit items</li>
                    <li>Manipulate auctions through shill bidding or false accounts</li>
                    <li>Harass, threaten, or abuse other users</li>
                    <li>Attempt to circumvent the platform for direct transactions</li>
                    <li>Use automated systems to place bids or scrape data</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Fees */}
              <Card>
                <CardHeader>
                  <CardTitle>6. Fees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    FrothMonkey may charge fees for certain services. Current fee structure:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Listing fees: Currently free</li>
                    <li>Final value fees: May apply to sold items</li>
                    <li>Premium features: May require subscription</li>
                  </ul>
                  <p>
                    Users will be notified of any fee changes with at least 30 days notice.
                  </p>
                </CardContent>
              </Card>

              {/* Content and Intellectual Property */}
              <Card>
                <CardHeader>
                  <CardTitle>7. Content and Intellectual Property</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    You retain ownership of content you post but grant FrothMonkey a license to use, display, and distribute it for service operation.
                  </p>
                  <p>
                    You represent that you have rights to all content you post and that it does not infringe on third-party rights.
                  </p>
                </CardContent>
              </Card>

              {/* Disclaimers and Limitations */}
              <Card>
                <CardHeader>
                  <CardTitle>8. Disclaimers and Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    FrothMonkey is provided "as is" without warranties. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Item authenticity, condition, or description accuracy</li>
                    <li>User conduct or transaction disputes</li>
                    <li>Service interruptions or data loss</li>
                    <li>Damages arising from platform use</li>
                  </ul>
                  <p>
                    Our liability is limited to the maximum extent permitted by law.
                  </p>
                </CardContent>
              </Card>

              {/* Termination */}
              <Card>
                <CardHeader>
                  <CardTitle>9. Termination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We may terminate or suspend accounts for violations of these Terms or for any reason at our discretion.
                  </p>
                  <p>
                    You may close your account at any time, but remain responsible for any outstanding obligations.
                  </p>
                </CardContent>
              </Card>

              {/* Changes to Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>10. Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last modified" date.
                  </p>
                  <p>
                    Continued use of the service after changes constitutes acceptance of the new Terms.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>11. Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    For questions about these Terms, please contact us at:
                  </p>
                  <div className="mt-4 space-y-1">
                    <p>Email: legal@frothmonkey.com</p>
                    <p>Address: [Your Business Address]</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
