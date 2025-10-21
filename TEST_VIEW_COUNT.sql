-- Test script for view count feature
-- Run this to verify the view count functionality is working

-- 1. Check if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_listing_view_count';

-- 2. Get a sample listing ID to test with
SELECT id, title 
FROM listings 
WHERE status = 'live' 
LIMIT 1;

-- 3. Check current view count for the first live listing
-- Replace the UUID below with a listing ID from step 2
-- SELECT get_listing_view_count('YOUR-LISTING-ID-HERE');

-- 4. Check recent listing views
SELECT 
    lv.listing_id,
    l.title,
    COUNT(*) as view_count,
    MAX(lv.created_at) as last_view
FROM listing_views lv
JOIN listings l ON l.id = lv.listing_id
GROUP BY lv.listing_id, l.title
ORDER BY view_count DESC
LIMIT 10;

-- 5. Check total views across all listings
SELECT 
    COUNT(*) as total_views,
    COUNT(DISTINCT listing_id) as unique_listings_viewed,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_views,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_views
FROM listing_views;

-- 6. Test the function with a specific listing
-- This should match the count from the manual COUNT query
SELECT 
    l.id,
    l.title,
    get_listing_view_count(l.id) as function_count,
    (SELECT COUNT(*) FROM listing_views WHERE listing_id = l.id) as manual_count,
    CASE 
        WHEN get_listing_view_count(l.id) = (SELECT COUNT(*) FROM listing_views WHERE listing_id = l.id)
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM listings l
WHERE status = 'live'
LIMIT 5;

-- 7. Check for any listings with views
SELECT 
    l.id,
    l.title,
    l.status,
    get_listing_view_count(l.id) as views
FROM listings l
WHERE status IN ('live', 'ended', 'sold')
ORDER BY get_listing_view_count(l.id) DESC
LIMIT 20;

