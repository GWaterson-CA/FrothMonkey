'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

const locationInterestSchema = z.object({
  location: z.string().min(2, 'Location must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
})

type LocationInterestData = z.infer<typeof locationInterestSchema>

interface LocationInterestFormProps {
  userId?: string
  trigger?: React.ReactNode
  className?: string
}

export function LocationInterestForm({ userId, trigger, className }: LocationInterestFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LocationInterestData>({
    resolver: zodResolver(locationInterestSchema),
  })

  const onSubmit = async (data: LocationInterestData) => {
    setIsSubmitting(true)

    try {
      // Prepare the data to insert
      const insertData: any = {
        location: data.location.trim(),
      }

      // Add user_id if the user is authenticated
      if (userId) {
        insertData.user_id = userId
      } else {
        // For non-authenticated users, require email
        if (!data.email || !data.email.trim()) {
          toast({
            title: 'Email required',
            description: 'Please enter your email address so we can contact you when FrothMonkey launches in your area',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
        insertData.email = data.email.trim()
      }

      const { error } = await supabase
        .from('location_interest')
        .insert(insertData)

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Already registered!',
            description: `We already have your interest in ${data.location}. We'll contact you when we launch there!`,
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: 'Interest registered! 🎉',
          description: `Thank you! We'll contact you when FrothMonkey launches in ${data.location}`,
        })
      }

      setIsOpen(false)
      reset()
    } catch (error) {
      console.error('Error submitting location interest:', error)
      toast({
        title: 'Error',
        description: 'Failed to register your interest. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <MapPin className="h-4 w-4 mr-2" />
      Request New Location
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request FrothMonkey in Your Area</DialogTitle>
          <DialogDescription>
            We're always looking to expand to new communities! Let us know where you are 
            and we'll contact you when we're ready to launch in your area.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Your Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Vancouver, BC or Toronto, ON"
              {...register('location')}
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {!userId && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to contact you when we launch in your area
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Request Location
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
