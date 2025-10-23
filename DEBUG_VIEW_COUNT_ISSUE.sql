-- Emergency diagnostic for view count issue
-- Run this in Supabase SQL Editor RIGHT NOW

-- 1. Check if the listing_views table has RLS that blocks inserts
SELECT 
    'RLS Policies Check' as test,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'listing_views'
ORDER BY cmd;

-- 2. Check if RLS is enabled
SELECT 
    'RLS Enabled Check' as test,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'listing_views';

-- 3. Try to manually insert a test view (this will fail if RLS blocks it)
DO $$
BEGIN
    -- Try inserting as anonymous user
    INSERT INTO listing_views (listing_id, ip_address, user_agent)
    VALUES (
        '3ba8cbf9-70ea-4adc-981d-758a8082cd42',
        '127.0.0.1'::INET,
        'Manual Test'
    );
    RAISE NOTICE 'SUCCESS: Manual insert worked!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Manual insert failed with error: %', SQLERRM;
END $$;

-- 4. Check if any views exist at all in the table
SELECT 
    'Total Views Check' as test,
    COUNT(*) as total_views_in_table,
    COUNT(DISTINCT listing_id) as listings_with_views,
    MAX(created_at) as most_recent_view
FROM listing_views;

-- 5. Try calling the record_listing_view function
DO $$
DECLARE
    result UUID;
BEGIN
    result := record_listing_view(
        '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::UUID,
        NULL,
        '127.0.0.1'::INET,
        'Function Test'
    );
    RAISE NOTICE 'SUCCESS: Function returned UUID: %', result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Function call failed with error: %', SQLERRM;
END $$;

-- 6. Verify the function exists and check its definition
SELECT 
    'Function Check' as test,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'record_listing_view';

-- 7. Check if the table even exists
SELECT 
    'Table Existence Check' as test,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'listing_views'
    ) as table_exists;

-- 8. If table exists, show its structure
SELECT 
    'Table Structure' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'listing_views'
ORDER BY ordinal_position;

