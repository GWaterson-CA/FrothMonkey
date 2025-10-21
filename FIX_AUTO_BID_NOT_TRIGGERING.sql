-- Complete Fix for Auto-Bid Not Triggering
-- Run this entire script in Supabase SQL Editor to ensure everything is set up correctly

-- ================================================
-- STEP 1: Verify Auto-Bid Infrastructure Exists
-- ================================================

-- Check if auto_bids table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auto_bids') THEN
        RAISE EXCEPTION 'auto_bids table does not exist! Please run the migration: 038_auto_bid_feature.sql';
    END IF;
    RAISE NOTICE 'auto_bids table exists ✓';
END $$;

-- ================================================
-- STEP 2: Ensure place_bid Calls process_auto_bids
-- ================================================

-- Check if place_bid function includes auto-bid processing
DO $$
DECLARE
    func_body TEXT;
BEGIN
    SELECT prosrc INTO func_body
    FROM pg_proc 
    WHERE proname = 'place_bid'
    LIMIT 1;
    
    IF func_body NOT LIKE '%process_auto_bids%' THEN
        RAISE EXCEPTION 'place_bid function does NOT call process_auto_bids! The migration needs to be applied.';
    END IF;
    RAISE NOTICE 'place_bid function includes auto-bid processing ✓';
END $$;

-- ================================================
-- STEP 3: Diagnostic for Specific Listing
-- ================================================

-- Show current state of listing 3ba8cbf9-70ea-4adc-981d-758a8082cd42
SELECT 
    '==== LISTING STATE ====' as section,
    l.title,
    l.status,
    l.current_price,
    l.start_price,
    l.bid_increment,
    l.reserve_price,
    l.reserve_met,
    next_min_bid(l.id) as next_required_bid
FROM listings l
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Show all bids
SELECT 
    '==== ALL BIDS ====' as section,
    b.amount,
    p.email as bidder_email,
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
JOIN profiles p ON b.bidder_id = p.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC;

-- Show all auto-bids
SELECT 
    '==== AUTO-BIDS ====' as section,
    ab.max_amount,
    p.email as user_email,
    ab.enabled,
    ab.created_at,
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
JOIN profiles p ON ab.user_id = p.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

-- Show detailed eligibility check
SELECT 
    '==== ELIGIBILITY ANALYSIS ====' as section,
    ab.max_amount as auto_bid_max,
    p.email as user_email,
    ab.enabled as is_enabled,
    next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as required_min,
    ab.max_amount >= next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as meets_minimum,
    (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
     ORDER BY amount DESC, created_at ASC LIMIT 1) as current_winner_id,
    ab.user_id != (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
                    ORDER BY amount DESC, created_at ASC LIMIT 1) as is_not_current_winner,
    CASE 
        WHEN ab.enabled 
         AND ab.max_amount >= next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42')
         AND ab.user_id != (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
                             ORDER BY amount DESC, created_at ASC LIMIT 1)
        THEN 'YES - SHOULD AUTO-BID NOW!'
        ELSE 'NO - Not eligible'
    END as should_auto_bid
FROM auto_bids ab
JOIN profiles p ON ab.user_id = p.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- ================================================
-- STEP 4: Manual Trigger Test
-- ================================================

-- Try to manually trigger auto-bid processing
SELECT 
    '==== MANUAL AUTO-BID TRIGGER ====' as section,
    * 
FROM process_auto_bids(
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    (SELECT bidder_id FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
     ORDER BY amount DESC, created_at ASC LIMIT 1)
);

-- Show final state after manual trigger
SELECT 
    '==== STATE AFTER MANUAL TRIGGER ====' as section,
    l.current_price as final_current_price,
    (SELECT MAX(amount) FROM bids WHERE listing_id = l.id) as highest_bid,
    (SELECT COUNT(*) FROM bids WHERE listing_id = l.id) as total_bids_now,
    (SELECT email FROM profiles WHERE id = (
        SELECT bidder_id FROM bids WHERE listing_id = l.id 
        ORDER BY amount DESC, created_at ASC LIMIT 1
    )) as current_winner_email
FROM listings l
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- ================================================
-- STEP 5: Recommendations
-- ================================================

SELECT 
    '==== RECOMMENDATIONS ====' as section,
    CASE 
        WHEN NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'auto_bids')
        THEN 'Run migration 038_auto_bid_feature.sql'
        WHEN NOT EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'process_auto_bids'
        )
        THEN 'process_auto_bids function missing - run migration'
        WHEN NOT EXISTS (
            SELECT FROM auto_bids 
            WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42' 
            AND enabled = true
        )
        THEN 'No active auto-bids found for this listing'
        ELSE 'Infrastructure OK - Check specific listing state above'
    END as recommendation;

