import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsPageClient } from './notifications-page-client'

export const metadata = {
  title: 'Notifications - Auction Marketplace',
  description: 'View and manage your notifications',
}

async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch initial notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      listing:listings(id, title, cover_image_url, status),
      related_user:profiles!notifications_related_user_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return (
    <NotificationsPageClient
      initialNotifications={notifications || []}
      initialUnreadCount={unreadCount || 0}
    />
  )
}

export default NotificationsPage
