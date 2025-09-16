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

const bidSchema = z.object({
  amount: z.number().min(0.01, 'Bid amount must be at least $0.01'),
})

type BidFormData = z.infer<typeof bidSchema>

interface BidFormProps {
  listingId: string
  currentPrice: number
  buyNowPrice?: number | null
}

export function BidForm({ listingId, currentPrice, buyNowPrice }: BidFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [minimumBid, setMinimumBid] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

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

  // Fetch minimum bid amount
  useEffect(() => {
    const fetchMinimumBid = async () => {
      try {
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
        console.error('Error fetching minimum bid:', error)
      }
    }

    fetchMinimumBid()
  }, [listingId, setValue, currentPrice])

  const onSubmit = async (data: BidFormData) => {
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

  return (
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
                step="0.01"
                min={minimumBid || 0.01}
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

        {/* Buy Now Button */}
        {buyNowPrice && (
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Bids are binding and cannot be retracted</p>
          <p>• Anti-sniping protection may extend the auction</p>
          <p>• You will be notified if you are outbid</p>
        </div>
      </CardContent>
    </Card>
  )
}
