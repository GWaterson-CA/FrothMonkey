-- =====================================================
-- TEST AUTO-BID EMAIL NOTIFICATIONS (NO AUTO-CLEANUP)
-- =====================================================
-- This script helps you test that email notifications
-- work correctly with the auto-bid feature
-- =====================================================

-- =====================================================
-- SETUP: Get User IDs and Create Test Listing
-- =====================================================

-- 1. Show available test users
SELECT p.id, p.username, u.email 
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'chukkey@gmail.com' 
   OR u.email != 'chukkey@gmail.com'
LIMIT 10;

-- 2. Create test listing with actual user IDs
DO $$
DECLARE
    v_user_a_id UUID;  -- Will be chukkey@gmail.com (auto-bid user)
    v_user_b_id UUID;  -- Will be another user (manual bidder)
    v_listing_id UUID;
BEGIN
    -- Get User A (chukkey@gmail.com) from auth.users
    SELECT p.id INTO v_user_a_id
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = 'chukkey@gmail.com'
    LIMIT 1;
    
    IF v_user_a_id IS NULL THEN
        RAISE EXCEPTION 'User with email chukkey@gmail.com not found';
    END IF;
    
    -- Get User B (any other user, excluding User A)
    SELECT p.id INTO v_user_b_id
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email != 'chukkey@gmail.com'
    LIMIT 1;
    
    IF v_user_b_id IS NULL THEN
        RAISE EXCEPTION 'No second user found for testing. Please create another test account.';
    END IF;
    
    RAISE NOTICE 'User A (auto-bid): % (%)', v_user_a_id, 'chukkey@gmail.com';
    RAISE NOTICE 'User B (manual bid): %', v_user_b_id;
    
    -- Create test listing owned by User A
    INSERT INTO listings (
        title,
        description,
        start_price,
        current_price,
        owner_id,
        category_id,
        status,
        start_time,
        end_time,
        location,
        condition
    )
    VALUES (
        'TEST: Auto-Bid Email Notification',
        'This is a test listing to verify auto-bid email notifications work correctly',
        20.00,
        20.00,
        v_user_a_id,
        (SELECT id FROM categories LIMIT 1), -- Use first available category
        'live',
        NOW(),
        NOW() + INTERVAL '7 days',
        'Test Location',
        'good'
    )
    RETURNING id INTO v_listing_id;
    
    RAISE NOTICE 'Test listing created with ID: %', v_listing_id;
    RAISE NOTICE '================================================';
    RAISE NOTICE 'IMPORTANT: Save these IDs for the rest of the test:';
    RAISE NOTICE 'User A ID: %', v_user_a_id;
    RAISE NOTICE 'User B ID: %', v_user_b_id;
    RAISE NOTICE 'Listing ID: %', v_listing_id;
    RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- TEST SCENARIO 1: Auto-Bid Protection (No Emails)
-- =====================================================

-- Get the listing ID and user IDs from the test listing just created
WITH test_data AS (
    SELECT 
        l.id as listing_id,
        l.owner_id as user_a_id,
        (SELECT id FROM profiles WHERE id != l.owner_id LIMIT 1) as user_b_id
    FROM listings l
    WHERE l.title LIKE 'TEST: Auto-Bid Email%'
    ORDER BY l.created_at DESC 
    LIMIT 1
)
SELECT 
    l.id as listing_id,
    l.title,
    l.current_price,
    l.owner_id as user_a_id,
    ua.email as user_a_email,
    (SELECT p.id FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email != 'chukkey@gmail.com' LIMIT 1) as user_b_id,
    (SELECT u.email FROM profiles p JOIN auth.users u ON u.id = p.id WHERE u.email != 'chukkey@gmail.com' LIMIT 1) as user_b_email
FROM listings l
JOIN profiles pa ON pa.id = l.owner_id
JOIN auth.users ua ON ua.id = pa.id
WHERE l.title LIKE 'TEST: Auto-Bid Email%'
ORDER BY l.created_at DESC 
LIMIT 1;

-- Set User A's (chukkey@gmail.com) auto-bid to $50 (should place initial bid at $25)
DO $$
DECLARE
    v_user_a_id UUID;
    v_listing_id UUID;
    v_result JSONB;
BEGIN
    -- Get User A ID from auth.users
    SELECT p.id INTO v_user_a_id 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = 'chukkey@gmail.com';
    
    -- Get test listing ID
    SELECT id INTO v_listing_id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1;
    
    -- Set auto-bid
    SELECT set_auto_bid(v_user_a_id, v_listing_id, 50.00) INTO v_result;
    
    RAISE NOTICE 'Auto-bid set result: %', v_result;
END $$;

-- Verify auto-bid was created
SELECT 
    ab.*,
    u.email as user_email
FROM auto_bids ab
JOIN auth.users u ON u.id = ab.user_id
WHERE ab.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1);

-- Verify initial bid was placed
SELECT 
    b.amount,
    b.is_auto_bid,
    b.created_at,
    p.username,
    u.email
FROM bids b
JOIN profiles p ON p.id = b.bidder_id
JOIN auth.users u ON u.id = p.id
WHERE b.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
ORDER BY b.created_at DESC;

-- User B bids $30 (should trigger auto-bid to $35, NO EMAIL to User A)
DO $$
DECLARE
    v_user_b_id UUID;
    v_listing_id UUID;
    v_result JSONB;
BEGIN
    -- Get User B ID (not chukkey@gmail.com) from auth.users
    SELECT p.id INTO v_user_b_id 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email != 'chukkey@gmail.com' 
    LIMIT 1;
    
    -- Get test listing ID
    SELECT id INTO v_listing_id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1;
    
    -- Place bid
    SELECT place_bid(v_listing_id, 30.00, v_user_b_id) INTO v_result;
    
    RAISE NOTICE 'User B bid $30 result: %', v_result;
END $$;

-- CHECK: User A (chukkey@gmail.com) should NOT have received an email notification
SELECT 
    n.created_at,
    n.type,
    n.title,
    n.message,
    u.email as recipient_email
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
AND n.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
AND n.type = 'bid_outbid'
ORDER BY n.created_at DESC;

-- Expected: NO ROWS (no outbid notification created)
-- Reason: User A's auto-bid (max $50) countered the $30 bid with $35

-- =====================================================
-- TEST SCENARIO 2: Another Bid Within Auto-Bid Limit
-- =====================================================

-- User B bids $40 (should trigger auto-bid to $45, NO EMAIL to User A)
DO $$
DECLARE
    v_user_b_id UUID;
    v_listing_id UUID;
    v_result JSONB;
BEGIN
    -- Get User B ID (not chukkey@gmail.com) from auth.users
    SELECT p.id INTO v_user_b_id 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email != 'chukkey@gmail.com' 
    LIMIT 1;
    
    -- Get test listing ID
    SELECT id INTO v_listing_id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1;
    
    -- Place bid
    SELECT place_bid(v_listing_id, 40.00, v_user_b_id) INTO v_result;
    
    RAISE NOTICE 'User B bid $40 result: %', v_result;
END $$;

-- CHECK: User A (chukkey@gmail.com) should STILL NOT have received an email
SELECT 
    n.created_at,
    n.type,
    n.title,
    n.message,
    u.email as recipient_email
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
AND n.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
AND n.type = 'bid_outbid'
ORDER BY n.created_at DESC;

-- Expected: NO ROWS (still no outbid notification)
-- Reason: User A's auto-bid (max $50) countered the $40 bid with $45

-- =====================================================
-- TEST SCENARIO 3: Bid Exceeds Auto-Bid Limit (EMAIL!)
-- =====================================================

-- User B bids $60 (EXCEEDS User A's $50 limit, SHOULD EMAIL User A)
DO $$
DECLARE
    v_user_b_id UUID;
    v_listing_id UUID;
    v_result JSONB;
BEGIN
    -- Get User B ID (not chukkey@gmail.com) from auth.users
    SELECT p.id INTO v_user_b_id 
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email != 'chukkey@gmail.com' 
    LIMIT 1;
    
    -- Get test listing ID
    SELECT id INTO v_listing_id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1;
    
    -- Place bid
    SELECT place_bid(v_listing_id, 60.00, v_user_b_id) INTO v_result;
    
    RAISE NOTICE 'User B bid $60 result: %', v_result;
    RAISE NOTICE '🎯 This bid should trigger an email to chukkey@gmail.com';
END $$;

-- CHECK: User A (chukkey@gmail.com) SHOULD have received an email notification
SELECT 
    n.created_at,
    n.type,
    n.title,
    n.message,
    u.email as recipient_email
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
AND n.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
AND n.type = 'bid_outbid'
ORDER BY n.created_at DESC;

-- Expected: ONE ROW showing outbid notification
-- Reason: User A's auto-bid (max $50) could not counter the $60 bid

-- =====================================================
-- VERIFICATION SUMMARY
-- =====================================================

-- Get complete bid history
SELECT 
    b.amount,
    b.is_auto_bid,
    b.created_at,
    p.username as bidder,
    u.email,
    CASE 
        WHEN b.is_auto_bid THEN '🤖 Auto-Bid'
        ELSE '👤 Manual Bid'
    END as bid_type
FROM bids b
JOIN profiles p ON p.id = b.bidder_id
JOIN auth.users u ON u.id = p.id
WHERE b.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
ORDER BY b.created_at ASC;

-- Expected bid history:
-- 1. $25 - chukkey@gmail.com - Auto-Bid (initial auto-bid placement)
-- 2. $30 - User B - Manual Bid
-- 3. $35 - chukkey@gmail.com - Auto-Bid (counter bid, no email to User A)
-- 4. $40 - User B - Manual Bid
-- 5. $45 - chukkey@gmail.com - Auto-Bid (counter bid, no email to User A)
-- 6. $60 - User B - Manual Bid (exceeds User A's limit, email sent to User A!)

-- Get all notifications for this listing
SELECT 
    n.created_at,
    p.username as recipient,
    u.email as recipient_email,
    n.type,
    n.title,
    n.message
FROM notifications n
JOIN profiles p ON p.id = n.user_id
JOIN auth.users u ON u.id = p.id
WHERE n.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
ORDER BY n.created_at ASC;

-- Expected notifications:
-- 1. first_bid_received - to listing owner (when first bid placed)
-- 2. bid_outbid - to chukkey@gmail.com (when $60 bid exceeded their $50 limit)
-- Only 1 outbid notification, not 2 or 3!

-- =====================================================
-- 🎯 TEST RESULTS SUMMARY
-- =====================================================

-- Count outbid notifications for chukkey@gmail.com
SELECT 
    COUNT(*) as outbid_notification_count,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Only 1 email sent!'
        WHEN COUNT(*) = 0 THEN '❌ FAIL - No email sent (should be 1)'
        ELSE '❌ FAIL - Too many emails sent (should be 1)'
    END as test_result
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
AND n.listing_id = (SELECT id FROM listings WHERE title LIKE 'TEST: Auto-Bid Email%' ORDER BY created_at DESC LIMIT 1)
AND n.type = 'bid_outbid';

-- Show the test listing for reference
SELECT 
    id,
    title,
    current_price,
    status,
    created_at
FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%'
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================
-- MANUAL CLEANUP (Run this when you're done reviewing)
-- =====================================================
/*
-- Uncomment and run this section when you want to delete the test listing:

DELETE FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%';

-- Verify cleanup
SELECT COUNT(*) as remaining_test_listings
FROM listings 
WHERE title LIKE 'TEST: Auto-Bid Email%';
*/

-- =====================================================
-- NOTES
-- =====================================================
/*
✅ PASS Criteria:

1. User A sets auto-bid at $50
   - Initial bid of $25 is placed
   
2. User B bids $30
   - Auto-bid counters to $35
   - NO notification sent to User A
   
3. User B bids $40
   - Auto-bid counters to $45
   - NO notification sent to User A
   
4. User B bids $60
   - User A's auto-bid cannot counter (exceeds $50)
   - ONE notification sent to User A
   - Email webhook triggers

Result: Only 1 email sent to User A, not 3!

The test listing is left in the database for you to review.
Run the MANUAL CLEANUP section above when you're done.
*/

