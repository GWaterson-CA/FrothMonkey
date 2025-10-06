import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Privacy Policy | FrothMonkey',
  description: 'Read FrothMonkey\'s Privacy Policy to understand how we collect, use, and protect your personal information on our auction marketplace platform.',
  alternates: {
    canonical: 'https://www.frothmonkey.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | FrothMonkey',
    description: 'Read FrothMonkey\'s Privacy Policy to understand how we collect, use, and protect your personal information.',
    url: 'https://www.frothmonkey.com/privacy',
    siteName: 'FrothMonkey',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Introduction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    At FrothMonkey, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our auction marketplace platform.
                  </p>
                  <p>
                    This policy applies to all users of FrothMonkey, including buyers, sellers, and visitors to our website.
                  </p>
                </CardContent>
              </Card>

              {/* Information We Collect */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Information We Collect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">Personal Information</h4>
                  <p>When you create an account or use our services, we may collect:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Username and profile information</li>
                    <li>Payment and billing information</li>
                    <li>Shipping and delivery addresses</li>
                    <li>Identity verification documents (when required)</li>
                  </ul>

                  <h4 className="font-semibold">Usage Information</h4>
                  <p>We automatically collect information about how you use our platform:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Browsing activity and search queries</li>
                    <li>Auction participation and bidding history</li>
                    <li>Messages and communications on the platform</li>
                    <li>Device information and IP address</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>

                  <h4 className="font-semibold">Content Information</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Auction listings, descriptions, and images</li>
                    <li>Reviews and ratings</li>
                    <li>Questions and answers on listings</li>
                    <li>Profile photos and descriptions</li>
                  </ul>
                </CardContent>
              </Card>

              {/* How We Use Information */}
              <Card>
                <CardHeader>
                  <CardTitle>3. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We use your information to:</p>
                  
                  <h4 className="font-semibold">Provide Our Services</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create and manage your account</li>
                    <li>Process transactions and facilitate auctions</li>
                    <li>Enable communication between users</li>
                    <li>Provide customer support</li>
                  </ul>

                  <h4 className="font-semibold">Improve Our Platform</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Analyze usage patterns and preferences</li>
                    <li>Develop new features and services</li>
                    <li>Optimize user experience</li>
                    <li>Conduct research and analytics</li>
                  </ul>

                  <h4 className="font-semibold">Safety and Security</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Prevent fraud and abuse</li>
                    <li>Enforce our Terms of Service</li>
                    <li>Verify user identity when necessary</li>
                    <li>Protect against security threats</li>
                  </ul>

                  <h4 className="font-semibold">Communications</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Send service-related notifications</li>
                    <li>Provide auction updates and alerts</li>
                    <li>Send marketing communications (with consent)</li>
                    <li>Respond to inquiries and support requests</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Information Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Information Sharing and Disclosure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold">With Other Users</h4>
                  <p>Certain information is visible to other users as part of the marketplace functionality:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Username and profile information</li>
                    <li>Auction listings and descriptions</li>
                    <li>Bidding activity (usernames may be partially hidden)</li>
                    <li>Reviews and ratings</li>
                    <li>Public questions and answers</li>
                  </ul>

                  <h4 className="font-semibold">Service Providers</h4>
                  <p>We may share information with trusted third-party service providers for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Payment processing</li>
                    <li>Email and communication services</li>
                    <li>Analytics and performance monitoring</li>
                    <li>Customer support tools</li>
                  </ul>

                  <h4 className="font-semibold">Legal Requirements</h4>
                  <p>We may disclose information when required by law or to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Comply with legal processes</li>
                    <li>Protect our rights and property</li>
                    <li>Ensure user safety</li>
                    <li>Investigate fraud or abuse</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Data Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication measures</li>
                    <li>Secure hosting and infrastructure</li>
                  </ul>
                  <p>
                    However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </CardContent>
              </Card>

              {/* Data Retention */}
              <Card>
                <CardHeader>
                  <CardTitle>6. Data Retention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Account information: Until account deletion plus legal retention requirements</li>
                    <li>Transaction records: 7 years for tax and legal purposes</li>
                    <li>Communication logs: 3 years for customer support and dispute resolution</li>
                    <li>Marketing data: Until you unsubscribe or object to processing</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card>
                <CardHeader>
                  <CardTitle>7. Your Privacy Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                  
                  <h4 className="font-semibold">Access and Portability</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Request access to your personal information</li>
                    <li>Receive a copy of your data in a portable format</li>
                  </ul>

                  <h4 className="font-semibold">Correction and Updates</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Update your profile information</li>
                    <li>Correct inaccurate or incomplete data</li>
                  </ul>

                  <h4 className="font-semibold">Deletion and Restriction</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Request deletion of your account and data</li>
                    <li>Restrict processing of your information</li>
                  </ul>

                  <h4 className="font-semibold">Objection and Withdrawal</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Object to processing for marketing purposes</li>
                    <li>Withdraw consent where processing is based on consent</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Cookies and Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We use cookies and similar technologies to enhance your experience and collect usage information.
                  </p>
                  
                  <h4 className="font-semibold">Types of Cookies We Use</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Essential cookies:</strong> Required for basic website functionality</li>
                    <li><strong>Performance cookies:</strong> Help us analyze and improve our services</li>
                    <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                    <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                  
                  <p>
                    You can control cookie settings through your browser preferences, but disabling certain cookies may limit website functionality.
                  </p>
                </CardContent>
              </Card>

              {/* Children's Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle>9. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    FrothMonkey is not intended for use by children under 18 years of age. We do not knowingly collect personal information from children under 18.
                  </p>
                  <p>
                    If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly.
                  </p>
                </CardContent>
              </Card>

              {/* International Transfers */}
              <Card>
                <CardHeader>
                  <CardTitle>10. International Data Transfers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers.
                  </p>
                  <p>
                    By using our services, you consent to the transfer of your information to countries that may have different data protection laws than your jurisdiction.
                  </p>
                </CardContent>
              </Card>

              {/* Policy Updates */}
              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to This Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.
                  </p>
                  <p>
                    We will notify users of material changes by posting the updated policy on our website with a new "Last updated" date. For significant changes, we may provide additional notice.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>12. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
                  </p>
                  <div className="space-y-1">
                    <p><strong>Email:</strong> privacy@frothmonkey.com</p>
                    <p><strong>Address:</strong> [Your Business Address]</p>
                  </div>
                  
                  <p>
                    We will respond to your inquiry within 30 days or as required by applicable law.
                  </p>
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
