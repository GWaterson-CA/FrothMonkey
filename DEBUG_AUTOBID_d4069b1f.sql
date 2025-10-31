-- Debug autobid not triggering for listing d4069b1f-67d2-4462-beab-fbf6eeb88d7e
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Check listing status
-- ============================================
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
    NOW() as current_time,
    CASE 
        WHEN status != 'live' THEN '❌ Listing is not live'
        WHEN NOW() < start_time THEN '❌ Auction has not started yet'
        WHEN NOW() > end_time THEN '❌ Auction has ended'
        ELSE '✅ Auction is active'
    END as auction_status
FROM listings 
WHERE id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e';

-- ============================================
-- STEP 2: Check current highest bidder
-- ============================================
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

-- ============================================
-- STEP 3: Check next minimum bid required
-- ============================================
SELECT 
    '=== NEXT MINIMUM BID ===' as section,
    next_min_bid('d4069b1f-67d2-4462-beab-fbf6eeb88d7e') as next_required_bid;

-- ============================================
-- STEP 4: Check autobids and eligibility
-- ============================================
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
    ab.user_id = cs.current_highest_bidder as is_current_winner,
    CASE 
        WHEN NOT ab.enabled THEN '❌ AUTO-BID IS DISABLED'
        WHEN ab.user_id = cs.current_highest_bidder THEN '❌ USER IS ALREADY HIGHEST BIDDER (won''t auto-bid until someone else bids)'
        WHEN ab.max_amount < cs.required_min THEN '❌ MAX AMOUNT TOO LOW (needs ' || cs.required_min || ' but max is ' || ab.max_amount || ')'
        ELSE '✅ ELIGIBLE TO AUTO-BID'
    END as eligibility_status
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
CROSS JOIN current_state cs
WHERE ab.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
ORDER BY ab.max_amount DESC;

-- ============================================
-- STEP 5: Manual test - try to trigger autobid
-- ============================================
-- This simulates what happens when someone places a manual bid
-- NOTE: This will only work if autobid user is NOT the current highest bidder
SELECT 
    '=== MANUAL AUTOBID TRIGGER TEST ===' as section,
    pab.auto_bid_placed,
    pab.new_bidder_id,
    au.email as new_bidder_email,
    pab.new_amount
FROM process_auto_bids(
    'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'::uuid,
    (SELECT bidder_id FROM bids 
     WHERE listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
     ORDER BY amount DESC, created_at ASC LIMIT 1)
) pab
LEFT JOIN auth.users au ON pab.new_bidder_id = au.id;

-- ============================================
-- STEP 6: Check all bids after test
-- ============================================
SELECT 
    '=== ALL BIDS (newest first) ===' as section,
    b.id,
    b.amount,
    au.email as bidder_email,
    b.is_auto_bid,
    b.created_at
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = 'd4069b1f-67d2-4462-beab-fbf6eeb88d7e'
ORDER BY b.created_at DESC;

-- ============================================
-- SUMMARY: Why autobid might not be triggering
-- ============================================
-- Most common reasons:
-- 1. ❌ Autobid user is already the highest bidder (autobids don't outbid themselves)
-- 2. ❌ Listing status is not 'live'
-- 3. ❌ Auction hasn't started or has ended
-- 4. ❌ Max amount is less than next required bid
-- 5. ❌ Autobid is disabled
-- 6. ⚠️  No manual bids have been placed since autobid was set

