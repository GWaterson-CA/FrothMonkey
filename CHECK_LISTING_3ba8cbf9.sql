-- Diagnostic for listing 3ba8cbf9-70ea-4adc-981d-758a8082cd42
-- Run this in Supabase SQL Editor

SET search_path TO public;

-- 1. Show listing current state
SELECT 
    '=== LISTING STATE ===' as section,
    title,
    status,
    current_price,
    start_price,
    reserve_price,
    reserve_met,
    start_time,
    end_time,
    start_time < NOW() as has_started,
    end_time > NOW() as is_active
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- 2. Show next minimum bid
SELECT 
    '=== NEXT MIN BID ===' as section,
    next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as next_required_bid;

-- 3. Show all bids (ordered by amount)
SELECT 
    '=== ALL BIDS ===' as section,
    b.id,
    b.amount,
    au.email as bidder_email,
    b.created_at,
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

-- 4. Show all auto-bids configured
SELECT 
    '=== AUTO-BIDS CONFIGURED ===' as section,
    ab.id,
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    ab.created_at,
    ab.updated_at,
    CASE 
        WHEN NOT ab.enabled THEN '❌ DISABLED'
        WHEN ab.user_id = (
            SELECT bidder_id FROM bids 
            WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
            ORDER BY amount DESC, created_at ASC LIMIT 1
        ) THEN '✓ Current winner (won''t auto-bid)'
        WHEN ab.max_amount >= next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') 
        THEN '✓ ELIGIBLE to auto-bid'
        ELSE '⚠ Max too low for next min bid'
    END as eligibility_status
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

-- 5. Check if listing is actually live and active
SELECT 
    '=== LISTING ELIGIBILITY ===' as section,
    CASE 
        WHEN status != 'live' THEN '❌ Status is not live: ' || status
        WHEN NOW() < start_time THEN '❌ Auction hasn''t started yet'
        WHEN NOW() > end_time THEN '❌ Auction has ended'
        ELSE '✓ Auction is live and active'
    END as auction_status
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- 6. Show who owns the listing (can't bid on own listing)
SELECT 
    '=== LISTING OWNER ===' as section,
    l.owner_id,
    au.email as owner_email
FROM listings l
JOIN auth.users au ON l.owner_id = au.id
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

