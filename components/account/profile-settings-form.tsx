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
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'
import type { Tables } from '@/lib/database.types'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be less than 24 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  paymentPreferences: z.array(z.string()).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'e-transfer', label: 'E-Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'bank_draft', label: 'Bank Draft' },
] as const

interface ProfileSettingsFormProps {
  profile: Tables<'profiles'>
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentPreferences, setPaymentPreferences] = useState<string[]>(
    profile.payment_preferences || []
  )
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username || '',
      fullName: profile.full_name || '',
      avatarUrl: profile.avatar_url || '',
      paymentPreferences: profile.payment_preferences || [],
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)

    try {
      // Check if username is already taken (if changed)
      if (data.username !== profile.username) {
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
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.fullName,
          avatar_url: data.avatarUrl || null,
          payment_preferences: paymentPreferences,
        })
        .eq('id', profile.id)

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
        description: 'Your profile has been updated successfully',
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          {...register('avatarUrl')}
          disabled={isLoading}
        />
        {errors.avatarUrl && (
          <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Provide a URL to an image to use as your profile picture.
        </p>
      </div>

      {/* Payment Preferences */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-medium">Payment Preferences</Label>
          <p className="text-sm text-muted-foreground">
            Select the payment methods you accept when selling items. This information will be displayed to potential buyers on your listings.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PAYMENT_METHODS.map((method) => {
            const isChecked = paymentPreferences.includes(method.value)
            
            return (
              <div key={method.value} className="flex items-center space-x-2">
                <Checkbox
                  id={method.value}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPaymentPreferences(prev => [...prev, method.value])
                    } else {
                      setPaymentPreferences(prev => prev.filter(p => p !== method.value))
                    }
                  }}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor={method.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {method.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          type="submit" 
          disabled={isLoading || !isDirty}
          className="min-w-[120px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        
        {isDirty && (
          <p className="text-sm text-muted-foreground">
            You have unsaved changes
          </p>
        )}
      </div>
    </form>
  )
}
