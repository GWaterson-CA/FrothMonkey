-- Manual test to trigger auto-bid processing
-- This will help us understand why auto-bid is not triggering
-- Run this in Supabase SQL Editor

-- First, let's see the current state
SELECT 
    'Current Listing State' as info,
    l.current_price,
    l.status,
    (SELECT COUNT(*) FROM bids WHERE listing_id = l.id) as total_bids,
    (SELECT COUNT(*) FROM auto_bids WHERE listing_id = l.id AND enabled = true) as active_auto_bids
FROM listings l
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Get the current highest bidder BEFORE manual trigger
SELECT 
    'Current Highest Bidder BEFORE' as info,
    b.bidder_id,
    b.amount,
    b.created_at
FROM bids b
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- Manually trigger process_auto_bids
-- This simulates what should happen after a manual bid
SELECT 
    'Manual Auto-Bid Trigger Results' as info,
    pab.auto_bid_placed,
    pab.new_bidder_id,
    pab.new_amount
FROM process_auto_bids(
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
     ORDER BY amount DESC, created_at ASC LIMIT 1)
) pab;

-- Get the current highest bidder AFTER manual trigger
SELECT 
    'Current Highest Bidder AFTER' as info,
    b.bidder_id,
    b.amount,
    b.created_at
FROM bids b
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- Show all bids to see what happened
SELECT 
    'All Bids (newest first)' as info,
    b.amount,
    p.email as bidder,
    b.created_at
FROM bids b
JOIN profiles p ON b.bidder_id = p.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.created_at DESC;

