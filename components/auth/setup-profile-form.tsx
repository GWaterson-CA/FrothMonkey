'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be less than 24 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms of Service to continue',
  }),
  biddingAgreementAccepted: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge the bidding agreement to participate in auctions',
  }),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Privacy Policy to continue',
  }),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface SetupProfileFormProps {
  userId: string
}

export function SetupProfileForm({ userId }: SetupProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)

    try {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username)
        .single()

      if (existingProfile) {
        setError('username', {
          type: 'manual',
          message: 'This username is already taken',
        })
        setIsLoading(false)
        return
      }

      // Create or update profile with legal agreement timestamps
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: data.username,
          full_name: data.fullName,
          terms_accepted_at: data.termsAccepted ? now : null,
          bidding_agreement_accepted_at: data.biddingAgreementAccepted ? now : null,
          privacy_policy_accepted_at: data.privacyPolicyAccepted ? now : null,
        })

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Your profile has been created successfully',
      })

      router.push('/')
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Choose a username"
          {...register('username')}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          {...register('fullName')}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      {/* Legal Agreements Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="text-sm font-medium text-center mb-4">
          Legal Agreements
        </div>

        {/* Bidding Agreement - Most Important */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-800">
            <strong>Important:</strong> By bidding on any auction, you are entering into a legally binding contract to purchase the item if you win.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
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

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              className="mt-1"
              {...register('termsAccepted')}
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-sm cursor-pointer">
              I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-destructive ml-6">{errors.termsAccepted.message}</p>
          )}

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="privacy"
              className="mt-1"
              {...register('privacyPolicyAccepted')}
              disabled={isLoading}
            />
            <label htmlFor="privacy" className="text-sm cursor-pointer">
              I agree to the <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>
            </label>
          </div>
          {errors.privacyPolicyAccepted && (
            <p className="text-sm text-destructive ml-6">{errors.privacyPolicyAccepted.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Complete Profile & Accept Agreements
      </Button>
    </form>
  )
}
