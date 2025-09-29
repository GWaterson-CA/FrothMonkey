-- =====================================================
-- DIAGNOSTIC QUERIES - Find the Real Bid Error
-- =====================================================
-- Run these queries one by one to diagnose the issue
-- =====================================================

-- 1. Check if notify_bid_placed trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_bid_placed';

-- Expected: Should show one row
-- If empty: Notifications trigger is missing
-- =====================================================

-- 2. Check if create_notification function exists
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_notification'
AND routine_schema = 'public';

-- Expected: Should show one row
-- If empty: Notifications system not installed
-- =====================================================

-- 3. Check if notifications table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'notifications';

-- Expected: Should show one row
-- If empty: Notifications table missing
-- =====================================================

-- 4. Check RLS policies on bids table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'bids';

-- Expected: Should show policies allowing INSERT for authenticated users
-- If empty or missing INSERT policy: RLS blocking bids
-- =====================================================

-- 5. Check if next_min_bid function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'next_min_bid'
AND routine_schema = 'public';

-- Expected: Should show one row
-- If empty: Helper function missing
-- =====================================================

-- 6. Try a test bid to see the exact error
-- REPLACE these UUIDs with real values from your database:
-- - listing_id: ID of a live auction
-- - bidder: Your user ID

-- First, get a live listing ID:
SELECT id, title, status, current_price, start_price 
FROM listings 
WHERE status = 'live' 
LIMIT 1;

-- Then get your user ID:
SELECT id, username 
FROM profiles 
LIMIT 5;

-- Now test the function (REPLACE THE UUIDs):
-- SELECT * FROM place_bid(
--     'your-listing-id-here'::UUID,
--     50,
--     'your-user-id-here'::UUID
-- );

-- =====================================================
-- INTERPRETING RESULTS
-- =====================================================
-- If queries 1-3 return empty: You need to apply the notifications migration
-- If query 4 shows no INSERT policy: You need to add RLS policies
-- If query 5 returns empty: You need the helper function
-- =====================================================
