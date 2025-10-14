import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Gavel, Github, Heart } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  // Read version from package.json
  const packageJson = require('../package.json')
  const version = packageJson.version || '1.2.0'

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <Image 
                src="/FrothMonkey Logo Blue.png" 
                alt="FrothMonkey Logo" 
                width={96} 
                height={96}
                className="h-6 w-auto"
                quality={100}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              A modern auction platform for buying and selling.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-mono">
                v{version}
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/sell/new" className="hover:text-foreground transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-foreground transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/category/kids-toys" className="hover:text-foreground transition-colors">
                  Kids Toys
                </Link>
              </li>
              <li>
                <Link href="/category/bikes" className="hover:text-foreground transition-colors">
                  Bikes
                </Link>
              </li>
              <li>
                <Link href="/category/home-and-garden" className="hover:text-foreground transition-colors">
                  Home & Garden
                </Link>
              </li>
              <li>
                <Link href="/category/vehicles" className="hover:text-foreground transition-colors">
                  Vehicles
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4">
              <span>© 2025 FrothMonkey</span>
              <span className="hidden sm:inline">•</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
              <span>for Squamish</span>
            </div>
            
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs">Live</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
