-- Test Auto-Bid Setup Manually
-- This simulates what happens when you set up an auto-bid
-- Replace YOUR_USER_ID with the actual user ID of one of your test accounts

-- First, let's see what the current state is
SELECT 
    'Current price: ' || current_price as info
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

SELECT 
    'Next min bid: ' || next_min_bid('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as info;

-- Try to manually call set_auto_bid for the first account ($12 max)
-- Replace 'YOUR_USER_ID_1' with the actual UUID
SELECT set_auto_bid(
    'YOUR_USER_ID_1'::uuid,  -- Replace with user 1's ID
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    12
);

-- Try to manually call set_auto_bid for the second account ($17 max)  
-- Replace 'YOUR_USER_ID_2' with the actual UUID
SELECT set_auto_bid(
    'YOUR_USER_ID_2'::uuid,  -- Replace with user 2's ID
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    17
);

-- Check what happened
SELECT 
    '=== BIDS AFTER AUTO-BID SETUP ===' as section,
    b.amount,
    au.email as bidder,
    b.created_at
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC;

SELECT 
    '=== AUTO-BIDS CONFIGURED ===' as section,
    au.email,
    ab.max_amount,
    ab.enabled
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

SELECT 
    'Final price: ' || current_price as info
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

