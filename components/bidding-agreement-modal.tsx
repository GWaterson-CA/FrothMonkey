'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, Gavel } from 'lucide-react'

const agreementSchema = z.object({
  biddingAgreementAccepted: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge the bidding agreement to participate in auctions',
  }),
})

type AgreementFormData = z.infer<typeof agreementSchema>

interface BiddingAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onAccepted: () => void
}

export function BiddingAgreementModal({ isOpen, onClose, onAccepted }: BiddingAgreementModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema),
  })

  const onSubmit = async (data: AgreementFormData) => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to accept the agreement',
          variant: 'destructive',
        })
        return
      }

      const now = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({
          bidding_agreement_accepted_at: now,
        })
        .eq('id', user.id)

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Agreement Accepted',
        description: 'You can now participate in auctions',
      })

      onAccepted()
      onClose()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Gavel className="h-5 w-5 text-primary" />
            <DialogTitle>Bidding Agreement Required</DialogTitle>
          </div>
          <DialogDescription>
            Before you can place bids on auctions, you must acknowledge and accept our bidding agreement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>Important Legal Notice:</strong> By placing a bid on any auction, you are entering into a legally binding contract to purchase the item if you are the winning bidder.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 text-sm">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-base">Key Points:</h4>
              <ul className="space-y-2 list-disc list-inside ml-2">
                <li>Each bid constitutes a legally binding offer to purchase</li>
                <li>Winning bidders are obligated to complete the transaction</li>
                <li>Payment must be made according to the seller's specified terms</li>
                <li>Failure to complete a purchase may result in account suspension</li>
                <li>Repeated violations may lead to permanent account termination</li>
                <li>Legal action may be pursued for breach of contract</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Before You Bid:</h4>
              <ul className="space-y-1 text-blue-800 list-disc list-inside ml-2">
                <li>Read the item description carefully</li>
                <li>Check the condition and any defects listed</li>
                <li>Understand the payment and pickup/shipping terms</li>
                <li>Ensure you can afford to complete the purchase</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="biddingAgreement"
              className="mt-1"
              {...register('biddingAgreementAccepted')}
              disabled={isLoading}
            />
            <label htmlFor="biddingAgreement" className="text-sm leading-relaxed cursor-pointer">
              <strong>I understand and agree</strong> that when I place a bid on an auction, I am entering into a legally binding contract to purchase that item at my bid price if I am the winning bidder. I acknowledge that winning bidders are obligated to complete the purchase and that failure to do so may result in account suspension and potential legal action.
            </label>
          </div>
          {errors.biddingAgreementAccepted && (
            <p className="text-sm text-destructive ml-6">{errors.biddingAgreementAccepted.message}</p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Agreement & Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
