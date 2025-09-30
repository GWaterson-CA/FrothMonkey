'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gavel, Mail, Shield, MapPin, DollarSign, UserPlus, CheckCircle2, CreditCard } from 'lucide-react'

interface AuthCTACardProps {
  isAuctionActive?: boolean
  isProfileIncomplete?: boolean
}

export function AuthCTACard({ isAuctionActive = true, isProfileIncomplete = false }: AuthCTACardProps) {
  const router = useRouter()

  // Profile Incomplete Version
  if (isProfileIncomplete) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <Badge variant="default" className="text-sm px-4 py-1.5">
              Quick & Easy Setup
            </Badge>
          </div>
          <CardTitle className="text-2xl">
            Complete Your Account Setup
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Just a few quick details to make bidding easy and stress-free
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What we need */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Choose a Username</p>
                <p className="text-xs text-muted-foreground">
                  Pick anything you like - it doesn't have to be your real name. This will be publicly visible, 
                  but you can always update it later in settings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment Preferences</p>
                <p className="text-xs text-muted-foreground">
                  Let us know how you'd like to be paid if you ever sell something. This makes the process 
                  smoother for everyone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bidding Agreement</p>
                <p className="text-xs text-muted-foreground">
                  Just a quick agreement that when you bid, you're committed to buying if you win. 
                  Keeps everything fair for our community.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              className="w-full h-12 text-base font-semibold"
              size="lg"
              onClick={() => router.push('/auth/setup-profile')}
            >
              <Gavel className="mr-2 h-5 w-5" />
              Complete Setup & Start Bidding
            </Button>
          </div>

          {/* Trust Message */}
          <div className="pt-2 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Takes less than 2 minutes. Your real name stays private - only your username is visible to others.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default Sign In/Sign Up Version
  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <Badge variant="default" className="text-sm px-4 py-1.5">
            100% Free to Join
          </Badge>
        </div>
        <CardTitle className="text-2xl">
          {isAuctionActive ? 'Sign In or Sign Up to Bid!' : 'Join FrothMonkey Today!'}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Create your free account and start bidding in seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Benefits */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">No Hidden Costs</p>
              <p className="text-xs text-muted-foreground">
                All payments are direct between buyer and seller once the auction ends
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Built for Squamish</p>
              <p className="text-xs text-muted-foreground">
                Your local marketplace designed specifically for our community
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Safe & Secure</p>
              <p className="text-xs text-muted-foreground">
                Buy and sell locally with peace of mind in your own community
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Quick Sign Up</p>
              <p className="text-xs text-muted-foreground">
                Just enter your email address and you're ready to start bidding
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full h-12 text-base font-semibold"
            size="lg"
            onClick={() => router.push('/auth/register')}
          >
            <Gavel className="mr-2 h-5 w-5" />
            Create Free Account
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/auth/login')}
          >
            Already have an account? Sign In
          </Button>
        </div>

        {/* Trust Message */}
        <div className="pt-2 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Join hundreds of Squamish residents buying and selling locally. 
            No credit card required. Start bidding in under a minute.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
