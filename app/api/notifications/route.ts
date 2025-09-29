import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/notifications - Fetch user's notifications
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const unreadOnly = searchParams.get('unread') === 'true'
  
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('notifications')
    .select(`
      *,
      listing:listings(id, title, cover_image_url, status),
      related_user:profiles!notifications_related_user_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data: notifications, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ 
    notifications,
    unreadCount: unreadCount || 0
  })
}

// POST /api/notifications - Create a notification (for testing/admin)
export async function POST(request: Request) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { type, title, message, listing_id, related_user_id, metadata } = body

  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: user.id,
    p_type: type,
    p_title: title,
    p_message: message,
    p_listing_id: listing_id || null,
    p_related_user_id: related_user_id || null,
    p_metadata: metadata || {}
  })

  if (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data })
}
