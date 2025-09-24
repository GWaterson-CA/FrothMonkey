'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
  listings?: {
    id: string
    title: string
    cover_image_url?: string
  }
  transactions?: {
    id: string
    final_price: number
  }
}

interface NotificationsListProps {
  initialNotifications?: Notification[]
}

export function NotificationsList({ initialNotifications = [] }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [loading, setLoading] = useState(false)

  const markAsRead = async (notificationIds: string[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAsRead: true,
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id)
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'auction_won':
        return '🏆'
      case 'auction_sold':
        return '💰'
      case 'auction_ended_no_reserve':
        return '⚠️'
      case 'auction_ended_no_bids':
        return '📋'
      default:
        return '🔔'
    }
  }

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case 'auction_won':
        return 'default' as const
      case 'auction_sold':
        return 'default' as const
      case 'auction_ended_no_reserve':
        return 'secondary' as const
      case 'auction_ended_no_bids':
        return 'outline' as const
      default:
        return 'secondary' as const
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No notifications</p>
          <p className="text-sm text-muted-foreground">
            You'll receive notifications when auctions you're involved in are completed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={loading}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`transition-colors ${
              !notification.read_at ? 'border-primary/20 bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{notification.title}</h3>
                    <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                      {notification.type.replace(/_/g, ' ')}
                    </Badge>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {notification.listings && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/listing/${notification.listings.id}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Listing
                          </Link>
                        </Button>
                      )}
                      
                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead([notification.id])}
                          disabled={loading}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
