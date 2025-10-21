-- Debug script for Auto-Bid issue on listing 3ba8cbf9-70ea-4adc-981d-758a8082cd42
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- Step 1: Check the listing details
SELECT 
    id,
    title,
    status,
    current_price,
    reserve_price,
    reserve_met,
    start_price,
    bid_increment,
    start_time < NOW() as has_started,
    end_time > NOW() as is_active,
    end_time
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Step 2: Check all bids on this listing (ordered by amount, descending)
SELECT 
    b.id,
    b.amount,
    b.created_at,
    p.email as bidder_email,
    b.bidder_id
FROM bids b
JOIN profiles p ON b.bidder_id = p.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC;

-- Step 3: Check all auto-bids on this listing
SELECT 
    ab.id,
    ab.user_id,
    p.email as user_email,
    ab.max_amount,
    ab.enabled,
    ab.created_at,
    ab.updated_at
FROM auto_bids ab
JOIN profiles p ON ab.user_id = p.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

-- Step 4: Calculate what the next minimum bid should be
SELECT next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as next_min_bid;

-- Step 5: Get current highest bidder
SELECT 
    b.bidder_id as current_highest_bidder_id,
    p.email as current_highest_bidder_email,
    b.amount as current_highest_amount
FROM bids b
JOIN profiles p ON b.bidder_id = p.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- Step 6: Check which auto-bid should be eligible
-- This simulates what process_auto_bids looks for
WITH current_state AS (
    SELECT next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as required_min,
           (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
            ORDER BY amount DESC, created_at ASC LIMIT 1) as current_highest_bidder
)
SELECT 
    ab.id as auto_bid_id,
    ab.user_id,
    p.email as user_email,
    ab.max_amount,
    ab.enabled,
    cs.required_min,
    cs.current_highest_bidder,
    ab.max_amount >= cs.required_min as meets_min_requirement,
    ab.user_id != cs.current_highest_bidder as is_not_current_winner,
    ab.enabled AND ab.max_amount >= cs.required_min AND ab.user_id != cs.current_highest_bidder as should_auto_bid
FROM auto_bids ab
JOIN profiles p ON ab.user_id = p.id
CROSS JOIN current_state cs
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC, ab.created_at ASC;

-- Step 7: Test if process_auto_bids function exists and works
-- Let's manually test what would happen if we called it
SELECT * FROM process_auto_bids(
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
     ORDER BY amount DESC, created_at ASC LIMIT 1)
);

