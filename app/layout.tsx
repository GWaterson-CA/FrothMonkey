import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

const baseUrl = 'https://www.frothmonkey.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'FrothMonkey - Online Auction Marketplace',
    template: '%s | FrothMonkey',
  },
  description: 'FrothMonkey is a modern online auction marketplace for buying and selling unique items. Discover amazing deals, bid on auctions, and sell your items to a vibrant community.',
  keywords: [
    'auction',
    'online auction',
    'marketplace',
    'buy and sell',
    'bidding',
    'auctions near me',
    'online marketplace',
    'auction site',
    'FrothMonkey',
  ],
  authors: [{ name: 'FrothMonkey' }],
  creator: 'FrothMonkey',
  publisher: 'FrothMonkey',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'FrothMonkey',
    title: 'FrothMonkey - Online Auction Marketplace',
    description: 'Discover amazing deals, bid on auctions, and sell your items on FrothMonkey - the modern auction marketplace.',
    images: [
      {
        url: `${baseUrl}/FrothMonkey Logo Blue.png`,
        width: 1200,
        height: 630,
        alt: 'FrothMonkey - Online Auction Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FrothMonkey - Online Auction Marketplace',
    description: 'Discover amazing deals, bid on auctions, and sell your items on FrothMonkey.',
    images: [`${baseUrl}/FrothMonkey Logo Blue.png`],
    creator: '@frothmonkey',
    site: '@frothmonkey',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    google: 'YJpQthJKEPUOsZ296YMx98AVOGsiH4wQ6Tj_olMNxUM',
    // bing: 'your-bing-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-58EQGVMELJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-58EQGVMELJ');
          `}
        </Script>
        <Providers>
          <AnalyticsTracker />
          {children}
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
