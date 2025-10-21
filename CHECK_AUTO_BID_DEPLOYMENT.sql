-- Check if auto-bid functions are properly deployed
-- Run this in Supabase SQL Editor

-- Check if auto_bids table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auto_bids'
) as auto_bids_table_exists;

-- Check if set_auto_bid function exists
SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'set_auto_bid'
) as set_auto_bid_function_exists;

-- Check if process_auto_bids function exists
SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'process_auto_bids'
) as process_auto_bids_function_exists;

-- Check the signature of place_bid to see if it includes auto-bid processing
SELECT pg_get_functiondef(oid) as place_bid_definition
FROM pg_proc 
WHERE proname = 'place_bid' 
  AND pg_get_function_identity_arguments(oid) = 'listing_id uuid, bid_amount numeric, bidder uuid';

-- Check if there's a newer version of place_bid
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosrc LIKE '%process_auto_bids%' as includes_auto_bid_processing
FROM pg_proc p
WHERE p.proname = 'place_bid';

