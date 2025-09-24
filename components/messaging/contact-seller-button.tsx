'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageCircle } from 'lucide-react'
import { MessageConversation } from './message-conversation'
import { getUserProfile } from '@/lib/auth'

interface ContactSellerButtonProps {
  listingId: string
  sellerId: string
  currentUserId?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
}

export function ContactSellerButton({ 
  listingId, 
  sellerId, 
  currentUserId,
  variant = 'outline',
  size = 'default',
  children
}: ContactSellerButtonProps) {
  const [open, setOpen] = useState(false)

  // Don't show contact button if user is the seller
  if (currentUserId === sellerId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          {children || (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[700px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Contact Seller</DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-0">
          {currentUserId && (
            <MessageConversation 
              listingId={listingId} 
              currentUserId={currentUserId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
