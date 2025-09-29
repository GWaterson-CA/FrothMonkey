'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  MessageSquare, 
  Gavel, 
  TrendingUp, 
  Clock, 
  Trophy,
  AlertTriangle,
  X,
  Circle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationsListProps {
  notifications: any[]
  onNotificationClick: (notification: any) => void
  onDelete?: (id: string) => void
  onMarkAsRead?: (id: string) => void
}

const notificationIcons = {
  question_received: MessageSquare,
  first_bid_received: Gavel,
  reserve_met: TrendingUp,
  listing_ended: Clock,
  listing_reported: AlertTriangle,
  bid_outbid: Gavel,
  auction_won: Trophy,
  time_warning_24h: Clock,
  time_warning_2h: Clock,
}

const notificationColors = {
  question_received: 'text-blue-500',
  first_bid_received: 'text-green-500',
  reserve_met: 'text-purple-500',
  listing_ended: 'text-gray-500',
  listing_reported: 'text-red-500',
  bid_outbid: 'text-orange-500',
  auction_won: 'text-yellow-500',
  time_warning_24h: 'text-blue-500',
  time_warning_2h: 'text-red-500',
}

export function NotificationsList({
  notifications,
  onNotificationClick,
  onDelete,
  onMarkAsRead,
}: NotificationsListProps) {
  return (
    <div className="divide-y">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || MessageSquare
        const iconColor = notificationColors[notification.type as keyof typeof notificationColors] || 'text-gray-500'
        const isUnread = !notification.read_at

        return (
          <div
            key={notification.id}
            className={`group relative flex gap-3 p-4 transition-colors hover:bg-muted/50 ${
              isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
            }`}
          >
            <div
              className="flex flex-1 cursor-pointer gap-3"
              onClick={() => onNotificationClick(notification)}
            >
              <div className={`mt-1 ${iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  {isUnread && (
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isUnread && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  title="Mark as read"
                >
                  <Circle className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(notification.id)
                  }}
                  title="Delete notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

