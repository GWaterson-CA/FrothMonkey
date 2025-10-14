'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ProfileCompletionReminderProps {
  userId: string | null
  hasUsername: boolean
}

export function ProfileCompletionReminder({ userId, hasUsername }: ProfileCompletionReminderProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only show popup if user is logged in but hasn't completed profile (no username)
    if (userId && !hasUsername) {
      // Check if user has dismissed this popup in the current session
      const dismissed = sessionStorage.getItem('profile-reminder-dismissed')
      if (!dismissed) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [userId, hasUsername])

  const handleCompleteProfile = () => {
    setOpen(false)
    router.push('/auth/setup-profile')
  }

  const handleDismiss = () => {
    setOpen(false)
    // Remember dismissal for this session only
    sessionStorage.setItem('profile-reminder-dismissed', 'true')
  }

  // Don't render if user has completed profile
  if (!userId || hasUsername) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p>
              Welcome to FrothMonkey! To start bidding on auctions or listing items for sale, 
              you need to complete your profile.
            </p>
            <p>
              This only takes a minute and helps create a better experience for everyone in our community.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full sm:w-auto"
          >
            Remind Me Later
          </Button>
          <Button
            onClick={handleCompleteProfile}
            className="w-full sm:w-auto"
          >
            Complete Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

