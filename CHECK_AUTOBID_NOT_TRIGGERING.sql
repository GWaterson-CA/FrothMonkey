-- Diagnostic query to check why autobid isn't triggering for listing d4069b1f-67d2-4462-beab-fbf6eeb88d7e
-- Run this in Supabase SQL Editor

-- 1. Check listing status and basic info
SELECT 
    '=== LISTING STATUS ===' as section,
    id,
    title,
    status,
    current_price,
    start_price,
    reserve_price,
    reserve_met,
    start_time,
    end_time,
    CASE 
        WHEN status != 'live' THEN '❌ Listing is not live'
        WHEN NOW() < start_time THEN '❌ Auction has not started yet'
        WHEN NOW() > end_time THEN '❌ Auction has ended'
        ELSE '✅ Auction is active'
    END as auction_status
FROM listings 
WHERE id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e';

-- 2. Check current highest bidder
SELECT 
    '=== CURRENT HIGHEST BIDDER ===' as section,
    b.bidder_id,
    au.email as bidder_email,
    b.amount as current_highest_bid,
    b.is_auto_bid,
    b.created_at
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- 3. Check what the next minimum bid would be
SELECT 
    '=== NEXT MINIMUM BID ===' as section,
    next_min_bid('d4069b1f-67d2-4462-beab-fbf6eeb88d7e') as next_required_bid;

-- 4. Check all autobids and their eligibility
WITH current_state AS (
    SELECT 
        next_min_bid('d4069b1f-67d2-4462-beab-fbf6eeb88d7e') as required_min,
        (SELECT bidder_id FROM bids 
         WHERE listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
         ORDER BY amount DESC, created_at ASC LIMIT 1) as current_highest_bidder
)
SELECT 
    '=== AUTO-BID ELIGIBILITY CHECK ===' as section,
    ab.id,
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    cs.required_min,
    cs.current_highest_bidder,
    CASE 
        WHEN NOT ab.enabled THEN '❌ AUTO-BID IS DISABLED'
        WHEN ab.user_id = cs.current_highest_bidder THEN '❌ USER IS ALREADY HIGHEST BIDDER (won''t auto-bid)'
        WHEN ab.max_amount < cs.required_min THEN '❌ MAX AMOUNT TOO LOW (needs ' || cs.required_min || ' but max is ' || ab.max_amount || ')'
        ELSE '✅ ELIGIBLE TO AUTO-BID'
    END as eligibility_status
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
CROSS JOIN current_state cs
WHERE ab.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
ORDER BY ab.max_amount DESC;

-- 5. Check if there have been any recent bids
SELECT 
    '=== RECENT BIDS (last 10) ===' as section,
    b.id,
    b.amount,
    au.email as bidder_email,
    b.is_auto_bid,
    b.created_at
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
ORDER BY b.created_at DESC
LIMIT 10;

-- 6. IMPORTANT: Check if autobid user is the current highest bidder
-- If they are, the autobid won't trigger (by design - you don't outbid yourself)
SELECT 
    '=== KEY ISSUE CHECK ===' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auto_bids ab
            JOIN bids b ON b.bidder_id = ab.user_id
            WHERE ab.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
            AND ab.enabled = true
            AND b.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
            AND b.id = (
                SELECT id FROM bids 
                WHERE listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
                ORDER BY amount DESC, created_at ASC LIMIT 1
            )
        ) THEN '⚠️ AUTOBID USER IS CURRENT HIGHEST BIDDER - Autobid won''t trigger until someone else bids'
        ELSE '✅ Autobid user is not the highest bidder - should trigger on next manual bid'
    END as key_issue;

