'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { MessageSquare, CheckCircle, XCircle, Clock, Mail, Phone, User } from 'lucide-react'
import { ContactMessaging } from './contact-messaging'

interface ContactExchange {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  status: 'pending_approval' | 'approved' | 'auto_approved' | 'declined'
  seller_contact_visible: boolean
  buyer_contact_visible: boolean
  reserve_met: boolean
  final_price: number
  created_at: string
  approved_at: string | null
  listing: {
    id: string
    title: string
    cover_image_url: string | null
    location: string
    end_time: string
  }
  seller: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  buyer: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

interface ContactExchangeCardProps {
  contact: ContactExchange
  currentUserId: string
  role: 'seller' | 'buyer'
  onUpdate?: () => void
}

export function ContactExchangeCard({ 
  contact, 
  currentUserId, 
  role,
  onUpdate 
}: ContactExchangeCardProps) {
  const router = useRouter()
  const [showMessaging, setShowMessaging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [localContact, setLocalContact] = useState(contact)

  const otherParty = role === 'seller' ? localContact.buyer : localContact.seller
  const canSeeContact = role === 'seller' 
    ? localContact.seller_contact_visible 
    : localContact.buyer_contact_visible
  const isApproved = ['approved', 'auto_approved'].includes(localContact.status)
  const isPending = localContact.status === 'pending_approval'
  const isDeclined = localContact.status === 'declined'

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/contacts/${localContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      if (!response.ok) {
        throw new Error('Failed to approve contact exchange')
      }

      // Update local state
      setLocalContact(prev => ({
        ...prev,
        status: 'approved' as const,
        seller_contact_visible: true,
        buyer_contact_visible: true,
        approved_at: new Date().toISOString()
      }))

      onUpdate?.()
      router.refresh()
    } catch (error) {
      console.error('Error approving contact:', error)
      alert('Failed to approve contact exchange')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this contact exchange? This cannot be undone.')) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/contacts/${localContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      })

      if (!response.ok) {
        throw new Error('Failed to decline contact exchange')
      }

      // Update local state
      setLocalContact(prev => ({
        ...prev,
        status: 'declined' as const,
        declined_at: new Date().toISOString()
      }))

      onUpdate?.()
      router.refresh()
    } catch (error) {
      console.error('Error declining contact:', error)
      alert('Failed to decline contact exchange')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">
                <Link 
                  href={`/listing/${localContact.listing.id}`}
                  className="hover:underline"
                >
                  {localContact.listing.title}
                </Link>
              </CardTitle>
              {isApproved && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Approved
                </Badge>
              )}
              {isPending && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              )}
              {isDeclined && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Declined
                </Badge>
              )}
              {!localContact.reserve_met && (
                <Badge variant="outline">Reserve Not Met</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Final Price: {formatCurrency(localContact.final_price)}</div>
              <div>Ended: {formatDateTime(localContact.listing.end_time)}</div>
              <div>Location: {localContact.listing.location}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Other Party Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar>
            <AvatarImage src={otherParty.avatar_url || undefined} />
            <AvatarFallback>
              {(otherParty.username || otherParty.full_name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">
              {role === 'seller' ? 'Buyer' : 'Seller'}: {otherParty.username || otherParty.full_name || 'Anonymous'}
            </div>
            {canSeeContact && isApproved && (
              <div className="text-sm text-muted-foreground">
                Contact details are now visible
              </div>
            )}
          </div>
        </div>

        {/* Pending Approval Actions (Seller only) */}
        {role === 'seller' && isPending && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Contact Exchange Request
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Your auction ended without meeting the reserve price. Would you like to share contact 
                details with the highest bidder?
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleApprove}
                disabled={isUpdating}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                onClick={handleDecline}
                disabled={isUpdating}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Pending Status (Buyer view) */}
        {role === 'buyer' && isPending && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Waiting for seller to approve contact exchange
              </span>
            </div>
          </div>
        )}

        {/* Declined Status */}
        {isDeclined && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {role === 'seller' 
                  ? 'You declined this contact exchange' 
                  : 'The seller declined this contact exchange'}
              </span>
            </div>
          </div>
        )}

        {/* Messaging (when approved) */}
        {isApproved && (
          <div>
            <Button 
              onClick={() => setShowMessaging(!showMessaging)}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showMessaging ? 'Hide Messages' : 'Show Messages'}
            </Button>

            {showMessaging && (
              <div className="mt-4">
                <ContactMessaging 
                  contactId={localContact.id}
                  currentUserId={currentUserId}
                  otherParty={otherParty}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
