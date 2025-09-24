'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageCircle, Users } from 'lucide-react'
import { MessageConversation } from './message-conversation'

interface ContactHighestBidderButtonProps {
  listingId: string
  highestBidderId: string
  currentUserId: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
}

export function ContactHighestBidderButton({ 
  listingId, 
  highestBidderId, 
  currentUserId,
  variant = 'outline',
  size = 'default',
  children
}: ContactHighestBidderButtonProps) {
  const [open, setOpen] = useState(false)

  // Don't show contact button if user is the highest bidder
  if (currentUserId === highestBidderId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          {children || (
            <>
              <Users className="h-4 w-4 mr-2" />
              Contact Highest Bidder
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[700px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Contact Highest Bidder</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Reach out to the highest bidder to discuss the item since the reserve wasn't met.
          </p>
        </DialogHeader>
        <div className="flex-1 p-6 pt-0">
          <MessageConversation 
            listingId={listingId} 
            currentUserId={currentUserId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
