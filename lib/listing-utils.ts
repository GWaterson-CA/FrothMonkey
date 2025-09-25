import { createClient } from '@/lib/supabase/server'

/**
 * Check if a listing has any bids placed
 */
export async function listingHasBids(listingId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bids')
    .select('id')
    .eq('listing_id', listingId)
    .limit(1)
    .single()
  
  // If we get data, there's at least one bid. If error is PGRST116 (no rows), no bids exist
  return data !== null && !error
}

/**
 * Get bid count for a listing
 */
export async function getBidCount(listingId: string): Promise<number> {
  const supabase = createClient()
  
  const { count, error } = await supabase
    .from('bids')
    .select('*', { count: 'exact' })
    .eq('listing_id', listingId)
  
  if (error) {
    console.error('Error getting bid count:', error)
    return 0
  }
  
  return count || 0
}

/**
 * Get the effective auction status considering time
 */
export function getEffectiveAuctionStatus(
  status: string, 
  startTime: Date | string, 
  endTime: Date | string
) {
  const now = new Date()
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime
  
  // If the auction has ended by time, it should be considered ended regardless of database status
  if (now > end) {
    return 'ended'
  }
  
  // If the auction hasn't started yet, it's scheduled
  if (now < start) {
    return 'scheduled'
  }
  
  // Otherwise, use the database status
  return status
}

/**
 * Check if a listing can be edited based on its status and bid activity
 */
export async function canEditListing(
  listingId: string,
  status: string,
  startTime: Date | string,
  endTime: Date | string
): Promise<{
  canEdit: boolean
  canEditPhotos: boolean
  canEditText: boolean
  canEditCategory: boolean
  canEditStartPrice: boolean
  canEditReservePrice: boolean
  canEditBuyNowPrice: boolean
  canEditEndTime: boolean
  reason?: string
}> {
  const effectiveStatus = getEffectiveAuctionStatus(status, startTime, endTime)
  const hasBids = await listingHasBids(listingId)
  
  // Can't edit ended auctions
  if (effectiveStatus === 'ended') {
    return {
      canEdit: false,
      canEditPhotos: false,
      canEditText: false,
      canEditCategory: false,
      canEditStartPrice: false,
      canEditReservePrice: false,
      canEditBuyNowPrice: false,
      canEditEndTime: false,
      reason: 'Auction has ended'
    }
  }
  
  // Draft and scheduled listings can be fully edited
  if (effectiveStatus === 'draft' || effectiveStatus === 'scheduled') {
    return {
      canEdit: true,
      canEditPhotos: true,
      canEditText: true,
      canEditCategory: true,
      canEditStartPrice: true,
      canEditReservePrice: true,
      canEditBuyNowPrice: true,
      canEditEndTime: true
    }
  }
  
  // Live auctions have conditional editing based on bid activity
  if (effectiveStatus === 'live') {
    return {
      canEdit: true,
      canEditPhotos: true, // Always allow photo editing for live auctions
      canEditText: true,   // Always allow text editing for live auctions
      canEditCategory: true, // Always allow category editing for live auctions
      canEditStartPrice: !hasBids, // Only if no bids placed
      canEditReservePrice: true,    // Always, but only lowering if bids exist
      canEditBuyNowPrice: true,     // Always, but only lowering if bids exist  
      canEditEndTime: !hasBids      // Only if no bids placed
    }
  }
  
  return {
    canEdit: false,
    canEditPhotos: false,
    canEditText: false,
    canEditCategory: false,
    canEditStartPrice: false,
    canEditReservePrice: false,
    canEditBuyNowPrice: false,
    canEditEndTime: false,
    reason: 'Unknown auction status'
  }
}
