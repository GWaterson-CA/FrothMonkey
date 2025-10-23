-- Diagnostic script to verify view count fix
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if listing_views table exists and has the right structure
SELECT 
    'Table Structure' as check_type,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'listing_views'
ORDER BY ordinal_position;

-- 2. Check if the record_listing_view function exists
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('record_listing_view', 'get_listing_view_count');

-- 3. Check RLS policies on listing_views table
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'listing_views';

-- 4. Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'listing_views';

-- 5. Check current view count for the specific listing
SELECT 
    '=== SPECIFIC LISTING (3ba8cbf9-70ea-4adc-981d-758a8082cd42) ===' as section;

SELECT 
    COUNT(*) as raw_count_from_table
FROM listing_views
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

SELECT 
    get_listing_view_count('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as count_from_function;

-- 6. Show all views for this listing (if any)
SELECT 
    lv.id,
    lv.listing_id,
    lv.user_id,
    lv.ip_address,
    lv.user_agent,
    lv.created_at,
    p.username
FROM listing_views lv
LEFT JOIN profiles p ON lv.user_id = p.id
WHERE lv.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY lv.created_at DESC
LIMIT 20;

-- 7. Check total view counts across all listings
SELECT 
    '=== ALL LISTINGS VIEW COUNTS ===' as section;

SELECT 
    l.id,
    l.title,
    l.status,
    COUNT(lv.id) as view_count,
    MAX(lv.created_at) as last_viewed
FROM listings l
LEFT JOIN listing_views lv ON l.id = lv.listing_id
WHERE l.status IN ('live', 'ended', 'sold')
GROUP BY l.id, l.title, l.status
ORDER BY view_count DESC, l.created_at DESC
LIMIT 20;

-- 8. Test the record_listing_view function manually
-- This will add a test view record
SELECT 
    '=== TESTING record_listing_view FUNCTION ===' as section;

-- Uncomment the line below to manually test adding a view
-- SELECT record_listing_view('3ba8cbf9-70ea-4adc-981d-758a8082cd42'::UUID);

-- 9. Check recent listing views across all listings
SELECT 
    '=== RECENT VIEWS (Last 50) ===' as section;

SELECT 
    lv.created_at,
    l.title,
    l.id as listing_id,
    p.username,
    lv.ip_address
FROM listing_views lv
JOIN listings l ON lv.listing_id = l.id
LEFT JOIN profiles p ON lv.user_id = p.id
ORDER BY lv.created_at DESC
LIMIT 50;

-- 10. Summary statistics
SELECT 
    '=== SUMMARY STATISTICS ===' as section;

SELECT 
    COUNT(DISTINCT listing_id) as listings_with_views,
    COUNT(*) as total_views,
    COUNT(DISTINCT user_id) as unique_authenticated_users,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_views,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_views,
    MIN(created_at) as first_view,
    MAX(created_at) as last_view
FROM listing_views;

