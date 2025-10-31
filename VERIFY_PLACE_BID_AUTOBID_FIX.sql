-- Verify that place_bid function includes process_auto_bids call
-- Run this to check if the fix has been applied

SELECT 
    'Function Check' as check_type,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    CASE 
        WHEN prosrc LIKE '%process_auto_bids%' THEN '✅ INCLUDES process_auto_bids call'
        ELSE '❌ MISSING process_auto_bids call'
    END as status,
    CASE 
        WHEN prosrc LIKE '%process_auto_bids%' THEN NULL
        ELSE 'Run URGENT_FIX_AUTOBID_NOT_TRIGGERING.sql to fix'
    END as action_required
FROM pg_proc 
WHERE proname = 'place_bid'
  AND pg_get_function_identity_arguments(oid) = 'listing_id uuid, bid_amount numeric, bidder uuid';

-- Also check if process_auto_bids function exists
SELECT 
    'Function Existence Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'process_auto_bids'
        ) THEN '✅ process_auto_bids function exists'
        ELSE '❌ process_auto_bids function MISSING'
    END as status;

