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
import { Loader2, Gavel, ShoppingCart } from 'lucide-react'
import { BiddingAgreementModal } from '@/components/bidding-agreement-modal'
import { createClient } from '@/lib/supabase/client'

const bidSchema = z.object({
  amount: z.number().min(1, 'Bid amount must be at least $1.00').multipleOf(1, 'Bids must be in full dollars (no cents)'),
})

type BidFormData = z.infer<typeof bidSchema>

interface BidFormProps {
  listingId: string
  currentPrice: number
  buyNowPrice?: number | null
  reserveMet?: boolean
}

export function BidForm({ listingId, currentPrice, buyNowPrice, reserveMet = false }: BidFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [minimumBid, setMinimumBid] = useState<number | null>(null)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState<boolean | null>(null)
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

  // Check if user has accepted bidding agreement and fetch minimum bid
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
          setValue('amount', data.minimumBid)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    checkAgreementAndFetchMinBid()
  }, [listingId, setValue, currentPrice, supabase])

  const onSubmit = async (data: BidFormData) => {
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
          amount: data.amount,
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

      // Refresh the page to show updated data
      router.refresh()
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

      router.refresh()
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Place Your Bid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Bid Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="1"
                min={minimumBid || 1}
                placeholder="Enter bid amount"
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Gavel className="mr-2 h-4 w-4" />
            Place Bid {bidAmount ? `(${formatCurrency(bidAmount)})` : ''}
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
          <div className="text-center py-4 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>

    <BiddingAgreementModal
      isOpen={showAgreementModal}
      onClose={() => setShowAgreementModal(false)}
      onAccepted={handleAgreementAccepted}
    />
    </>
  )
}
