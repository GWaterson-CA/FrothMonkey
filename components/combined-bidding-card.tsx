'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Gavel, ShoppingCart, Info } from 'lucide-react'
import { BiddingAgreementModal } from '@/components/bidding-agreement-modal'
import { createClient } from '@/lib/supabase/client'
import { CountdownTimer } from '@/components/countdown-timer'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const bidSchema = z.object({
  amount: z.number().min(1, 'Bid amount must be at least $1.00').multipleOf(1, 'Bids must be in full dollars (no cents)'),
})

type BidFormData = z.infer<typeof bidSchema>

interface CombinedBiddingCardProps {
  listingId: string
  currentPrice: number
  startPrice: number
  reservePrice?: number | null
  reserveMet?: boolean
  buyNowPrice?: number | null
  buyNowEnabled?: boolean
  endTime: string
  isLive: boolean
  canBid: boolean
  isLoggedIn: boolean
  hasProfile: boolean
}

export function CombinedBiddingCard({ 
  listingId, 
  currentPrice, 
  startPrice,
  reservePrice,
  reserveMet = false,
  buyNowPrice,
  buyNowEnabled = false,
  endTime,
  isLive,
  canBid,
  isLoggedIn,
  hasProfile
}: CombinedBiddingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [minimumBid, setMinimumBid] = useState<number | null>(null)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState<boolean | null>(null)
  const [isAutoBidEnabled, setIsAutoBidEnabled] = useState(false)
  const [existingAutoBid, setExistingAutoBid] = useState<{ id: string; maxAmount: number; enabled: boolean } | null>(null)
  const [isWinning, setIsWinning] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  })

  const bidAmount = watch('amount')

  // Check if user has accepted bidding agreement, fetch minimum bid, check for existing auto-bid, and check if user is winning
  useEffect(() => {
    const checkAgreementAndFetchMinBid = async () => {
      try {
        // Check bidding agreement status
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('bidding_agreement_accepted_at')
            .eq('id', user.id)
            .single()
          
          setHasAcceptedAgreement(!!profile?.bidding_agreement_accepted_at)

          // Check if user is currently winning (has the highest bid)
          const { data: highestBid } = await supabase
            .from('bids')
            .select('bidder_id, amount')
            .eq('listing_id', listingId)
            .order('amount', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

          if (highestBid && highestBid.bidder_id === user.id) {
            setIsWinning(true)
          } else {
            setIsWinning(false)
          }

          // Fetch existing auto-bid
          const autoBidResponse = await fetch('/api/auto-bid/get', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ listingId }),
          })

          if (autoBidResponse.ok) {
            const autoBidData = await autoBidResponse.json()
            if (autoBidData.autoBid && autoBidData.autoBid.enabled) {
              setExistingAutoBid(autoBidData.autoBid)
              setIsAutoBidEnabled(true)
              setValue('amount', autoBidData.autoBid.maxAmount)
            }
          }
        }

        // Fetch minimum bid
        const response = await fetch('/api/rpc/next-min-bid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId }),
        })

        if (response.ok) {
          const data = await response.json()
          setMinimumBid(data.minimumBid)
          // Only set the amount to minimum if no auto-bid exists
          if (!existingAutoBid) {
            setValue('amount', data.minimumBid)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (canBid || isLoggedIn) {
      checkAgreementAndFetchMinBid()
    }
  }, [listingId, setValue, currentPrice, supabase, canBid, isLoggedIn])

  const onSubmit = async (data: BidFormData) => {
    // Check if user has accepted bidding agreement
    if (hasAcceptedAgreement === false) {
      setShowAgreementModal(true)
      return
    }

    setIsLoading(true)

    try {
      // If auto-bid is enabled, use the auto-bid API
      if (isAutoBidEnabled) {
        const response = await fetch('/api/auto-bid/set', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            maxAmount: data.amount,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          toast({
            title: 'Auto-Bid Failed',
            description: result.error || 'Failed to set auto-bid',
            variant: 'destructive',
          })

          if (result.minimumRequired) {
            setMinimumBid(result.minimumRequired)
            setValue('amount', result.minimumRequired)
          }
          return
        }

        toast({
          title: 'Auto-Bid Set!',
          description: `Auto-bid enabled with maximum of ${formatCurrency(data.amount)}. We'll bid for you automatically when you're outbid.`,
        })

        // Reload the page to show updated data
        window.location.reload()
      } else {
        // Regular manual bid
        const response = await fetch('/api/rpc/place-bid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            amount: data.amount,
            isBuyNow: false,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          toast({
            title: 'Bid Failed',
            description: result.error || 'Failed to place bid',
            variant: 'destructive',
          })

          if (result.minimumRequired) {
            setMinimumBid(result.minimumRequired)
            setValue('amount', result.minimumRequired)
          }
          return
        }

        if (result.buyNow) {
          toast({
            title: 'Purchase Successful!',
            description: `You have successfully purchased this item for ${formatCurrency(result.newHighest)}`,
          })
        } else {
          toast({
            title: 'Bid Placed!',
            description: `Your bid of ${formatCurrency(result.newHighest)} has been placed successfully`,
          })
        }

        // Reload the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!buyNowPrice) return

    // Check if user has accepted bidding agreement
    if (hasAcceptedAgreement === false) {
      setShowAgreementModal(true)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/rpc/place-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          amount: buyNowPrice,
          isBuyNow: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Failed to complete purchase',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Purchase Successful!',
        description: `You have successfully purchased this item for ${formatCurrency(buyNowPrice)}`,
      })

      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgreementAccepted = () => {
    setHasAcceptedAgreement(true)
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span>Current Bid</span>
            {isWinning && isLive && (
              <span className="text-base font-semibold text-blue-600">
                YOU ARE CURRENTLY WINNING
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Bid Display */}
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(currentPrice || startPrice)}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Starting bid:</span>
              <span>{formatCurrency(startPrice)}</span>
            </div>
            {reservePrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserve price:</span>
                <span>
                  {reserveMet ? 
                    formatCurrency(reservePrice) : 
                    'Not disclosed'
                  }
                </span>
              </div>
            )}
            {buyNowPrice && !reserveMet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buy now price:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(buyNowPrice)}
                </span>
              </div>
            )}
          </div>

          {/* Countdown Timer */}
          {isLive && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                Time remaining:
              </div>
              <CountdownTimer endTime={endTime} />
            </div>
          )}

          {/* Bidding Form - Only show if user can bid */}
          {canBid && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Place Your Bid</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{isAutoBidEnabled ? 'Maximum Bid Amount' : 'Bid Amount'}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="1"
                      min={minimumBid || 1}
                      placeholder={isAutoBidEnabled ? "Enter maximum bid" : "Enter bid amount"}
                      className="pl-6"
                      {...register('amount', { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                  {minimumBid && (
                    <p className="text-sm text-muted-foreground">
                      Minimum bid: {formatCurrency(minimumBid)}
                    </p>
                  )}
                </div>

                {/* Auto-Bid Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-bid" className="cursor-pointer">
                      Auto Bid
                    </Label>
                    <Tooltip>
                      <TooltipTrigger type="button" onClick={(e) => e.preventDefault()}>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">When you set an auto-bid:</p>
                          <p>• You set your maximum bid amount.</p>
                          <p>• When someone bids higher than you, we'll place the next minimum bid for you.</p>
                          <p>• You'll stay in the lead – until you reach your maximum bid.</p>
                          <p>• No additional bids will be placed if you lead the bidding.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="auto-bid"
                    checked={isAutoBidEnabled}
                    onCheckedChange={setIsAutoBidEnabled}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Gavel className="mr-2 h-4 w-4" />
                  {isAutoBidEnabled 
                    ? `Set Auto-Bid ${bidAmount ? `(Max: ${formatCurrency(bidAmount)})` : ''}` 
                    : `Place Bid ${bidAmount ? `(${formatCurrency(bidAmount)})` : ''}`
                  }
                </Button>
              </form>

              {/* Buy Now Button - Only show if reserve not met */}
              {buyNowPrice && !reserveMet && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBuyNow}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Now for {formatCurrency(buyNowPrice)}
                  </Button>
                </>
              )}

              {/* Reserve met message */}
              {buyNowPrice && reserveMet && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  <p>Buy Now is no longer available - reserve price has been reached.</p>
                  <p>The auction will continue until the end time.</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Bids are binding and cannot be retracted</p>
                <p>• Anti-sniping protection may extend the auction</p>
                <p>• You will be notified if you are outbid</p>
                {hasAcceptedAgreement === false && (
                  <p className="text-orange-600 font-medium">• You must accept the bidding agreement to place bids</p>
                )}
              </div>
            </>
          )}

          {/* Auth CTA for non-logged-in users */}
          {!isLoggedIn && isLive && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Sign in to place a bid
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => router.push('/auth/register')}
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}

          {/* Profile incomplete CTA */}
          {isLoggedIn && !hasProfile && isLive && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Complete your profile to bid
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push('/auth/setup-profile')}
              >
                Complete Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <BiddingAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        onAccepted={handleAgreementAccepted}
      />
    </TooltipProvider>
  )
}
