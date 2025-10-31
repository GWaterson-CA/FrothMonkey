'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationsList } from '@/components/notifications/notifications-list'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NotificationsPageClientProps {
  initialNotifications: any[]
  initialUnreadCount: number
}

export function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [activeTab, setActiveTab] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('Notification change:', payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }
    
    // Handle "New Message" notifications
    if (notification.type === 'new_message' && notification.metadata?.contact_id) {
      try {
        // Fetch the contact exchange to determine if user is seller or buyer
        const response = await fetch(`/api/contacts/${notification.metadata.contact_id}`)
        if (response.ok) {
          const contact = await response.json()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            // Determine user's role and navigate to the appropriate page
            if (contact.seller_id === user.id) {
              router.push('/account/listings?tab=contacts')
            } else if (contact.buyer_id === user.id) {
              router.push('/account/bids?tab=contacts')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contact exchange:', error)
        // Fallback: navigate to listings page
        router.push('/account/listings?tab=contacts')
      }
      return
    }
    
    // Handle listing-based notifications
    if (notification.listing_id) {
      router.push(`/listing/${notification.listing_id}`)
    }
  }

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read_at)
    : notifications

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your auctions and bids
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">No notifications</CardTitle>
                <CardDescription>
                  You'll see notifications here when there's activity on your listings and bids
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <NotificationsList
                  notifications={filteredNotifications}
                  onNotificationClick={handleNotificationClick}
                  onDelete={deleteNotification}
                  onMarkAsRead={markAsRead}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {unreadCount === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCheck className="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <CardTitle className="mb-2">All caught up!</CardTitle>
                <CardDescription>
                  You have no unread notifications
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <NotificationsList
                  notifications={filteredNotifications}
                  onNotificationClick={handleNotificationClick}
                  onDelete={deleteNotification}
                  onMarkAsRead={markAsRead}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
