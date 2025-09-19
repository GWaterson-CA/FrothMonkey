import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '24h'
    const customStart = searchParams.get('start')
    const customEnd = searchParams.get('end')

    let startTime: string
    let endTime: string = new Date().toISOString()

    // Handle time periods
    if (period === 'custom' && customStart && customEnd) {
      startTime = new Date(customStart).toISOString()
      endTime = new Date(customEnd).toISOString()
    } else {
      const now = new Date()
      const periodMap: Record<string, number> = {
        '1h': 1,
        '6h': 6,
        '12h': 12,
        '24h': 24,
        '2d': 48,
        '3d': 72,
        '5d': 120,
        '7d': 168,
        '10d': 240,
        '14d': 336,
        '21d': 504,
        '30d': 720,
        '31d': 744,
      }

      const hours = periodMap[period] || 24
      startTime = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
    }

    const supabase = createClient()

    // Call the analytics function
    const { data, error } = await supabase
      .rpc('get_admin_analytics', {
        start_time: startTime,
        end_time: endTime
      })

    if (error) {
      console.error('Analytics error:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
