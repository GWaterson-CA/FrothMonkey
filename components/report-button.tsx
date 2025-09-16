'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

interface ReportButtonProps {
  listingId: string
  userId?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
}

const reportReasons = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'misleading_info', label: 'Misleading Information' },
  { value: 'copyright_violation', label: 'Copyright Violation' },
  { value: 'counterfeit', label: 'Counterfeit Item' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
]

export function ReportButton({ 
  listingId, 
  userId, 
  size = 'sm', 
  variant = 'outline' 
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to report listings',
        variant: 'destructive',
      })
      return
    }

    if (!reason) {
      toast({
        title: 'Reason required',
        description: 'Please select a reason for reporting this listing',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('listing_reports')
        .insert({
          listing_id: listingId,
          reporter_id: userId,
          reason,
          description: description.trim() || null,
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Already reported',
            description: 'You have already reported this listing',
            variant: 'destructive',
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: 'Report submitted',
        description: 'Thank you for your report. We will review it shortly.',
      })

      setIsOpen(false)
      setReason('')
      setDescription('')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Listing</DialogTitle>
          <DialogDescription>
            Help us keep our marketplace safe by reporting inappropriate content.
            All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional details about why you're reporting this listing..."
              className="min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
