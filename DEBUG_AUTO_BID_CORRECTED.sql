-- Corrected Debug Script for Auto-Bid Issue
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- Step 1: Check the listing details
SELECT 
    '==== LISTING DETAILS ====' as section,
    l.id,
    l.title,
    l.status,
    l.current_price,
    l.reserve_price,
    l.reserve_met,
    l.start_price,
    l.start_time < NOW() as has_started,
    l.end_time > NOW() as is_active,
    l.end_time
FROM listings l
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Step 2: Check all bids on this listing (ordered by amount, descending)
SELECT 
    '==== ALL BIDS ====' as section,
    b.id,
    b.amount,
    b.created_at,
    au.email as bidder_email,
    b.bidder_id,
    CASE 
        WHEN b.bidder_id = (
            SELECT bidder_id FROM bids 
            WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
            ORDER BY amount DESC, created_at ASC LIMIT 1
        ) THEN '← CURRENT WINNER'
        ELSE ''
    END as status
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC;

-- Step 3: Check all auto-bids on this listing
SELECT 
    '==== AUTO-BIDS ====' as section,
    ab.id,
    ab.user_id,
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    ab.created_at,
    ab.updated_at,
    CASE 
        WHEN ab.user_id = (
            SELECT bidder_id FROM bids 
            WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
            ORDER BY amount DESC, created_at ASC LIMIT 1
        ) THEN '← CURRENT WINNER (should not auto-bid)'
        WHEN ab.max_amount >= next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') THEN '← ELIGIBLE TO AUTO-BID'
        ELSE '← Max bid too low'
    END as status
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

-- Step 4: Calculate what the next minimum bid should be
SELECT 
    '==== NEXT MIN BID ====' as section,
    next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as next_min_bid;

-- Step 5: Get current highest bidder
SELECT 
    '==== CURRENT HIGHEST BIDDER ====' as section,
    b.bidder_id as current_highest_bidder_id,
    au.email as current_highest_bidder_email,
    b.amount as current_highest_amount
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
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
    '==== ELIGIBILITY ANALYSIS ====' as section,
    ab.id as auto_bid_id,
    ab.user_id,
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    cs.required_min,
    cs.current_highest_bidder,
    ab.max_amount >= cs.required_min as meets_min_requirement,
    ab.user_id != cs.current_highest_bidder as is_not_current_winner,
    ab.enabled AND ab.max_amount >= cs.required_min AND ab.user_id != cs.current_highest_bidder as should_auto_bid
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
CROSS JOIN current_state cs
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC, ab.created_at ASC;

-- Step 7: Test if process_auto_bids function exists and works
-- Let's manually test what would happen if we called it
SELECT 
    '==== MANUAL AUTO-BID TRIGGER ====' as section,
    pab.auto_bid_placed,
    pab.new_bidder_id,
    pab.new_amount
FROM process_auto_bids(
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
     ORDER BY amount DESC, created_at ASC LIMIT 1)
) pab;

-- Step 8: Show final state after manual trigger
SELECT 
    '==== STATE AFTER MANUAL TRIGGER ====' as section,
    l.current_price as final_current_price,
    (SELECT MAX(amount) FROM bids WHERE listing_id = l.id) as highest_bid,
    (SELECT COUNT(*) FROM bids WHERE listing_id = l.id) as total_bids_now,
    (SELECT au.email FROM auth.users au WHERE au.id = (
        SELECT bidder_id FROM bids WHERE listing_id = l.id 
        ORDER BY amount DESC, created_at ASC LIMIT 1
    )) as current_winner_email
FROM listings l
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

