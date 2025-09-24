import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'
import { NotificationsList } from '@/components/notifications/notifications-list'

async function NotificationsContent() {
  const profile = await getUserProfile()
  const supabase = createClient()

  if (!profile) {
    return <div>Profile not found</div>
  }

  // Fetch user's notifications
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      listings (
        id,
        title,
        cover_image_url
      ),
      transactions (
        id,
        final_price
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return <div>Error loading notifications</div>
  }

  return <NotificationsList initialNotifications={notifications || []} />
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated on your auction activity and important updates.
        </p>
      </div>

      <Suspense fallback={<div>Loading notifications...</div>}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}
