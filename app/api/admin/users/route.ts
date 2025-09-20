import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()

    const supabase = createClient()

    // Try the comprehensive stats function first, fallback to basic query
    let { data: users, error } = await supabase
      .rpc('get_admin_user_stats')

    if (error) {
      console.log('Admin stats function not available, falling back to basic query:', error)
      
      // Fallback to basic user query if the function doesn't exist
      const { data: basicUsers, error: basicError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          is_admin,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (basicError) {
        console.error('Basic users fetch error:', basicError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      // Add default values for missing statistics
      users = basicUsers.map(user => ({
        ...user,
        email: null,
        total_listings: 0,
        active_listings: 0,
        sold_listings: 0,
        total_sales_value: 0,
        total_bids_placed: 0,
        total_bid_value: 0,
        times_reported: 0,
        average_rating: 0,
        review_count: 0,
        last_active: user.created_at
      }))
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('admin_delete_user', { user_uuid: userId })

    if (error) {
      console.error('User deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('User deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
