-- ⚠️ URGENT FIX FOR VIEW COUNT TRACKING ⚠️
-- Copy and paste this entire file into Supabase SQL Editor and run it
-- This fixes the REAL issue preventing view tracking

-- The problem: record_listing_view and record_page_view functions 
-- don't have SECURITY DEFINER, so they can't bypass RLS even though
-- there's an INSERT policy. The functions need elevated permissions.

-- ============================================================================
-- FIX 1: Update record_listing_view with SECURITY DEFINER
-- ============================================================================

DROP FUNCTION IF EXISTS record_listing_view(UUID, UUID, INET, TEXT);

CREATE OR REPLACE FUNCTION record_listing_view(
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER -- 🔑 This is the key fix - allows bypassing RLS
SET search_path = public
AS $$
DECLARE
    view_id UUID;
BEGIN
    INSERT INTO listing_views (listing_id, user_id, ip_address, user_agent)
    VALUES (listing_uuid, user_uuid, ip_addr, user_agent_string)
    RETURNING id INTO view_id;
    
    RETURN view_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION record_listing_view(UUID, UUID, INET, TEXT) TO authenticated, anon;

-- ============================================================================
-- FIX 2: Update record_page_view with SECURITY DEFINER
-- ============================================================================

DROP FUNCTION IF EXISTS record_page_view(TEXT, UUID, INET, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION record_page_view(
    page_path TEXT,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL,
    utm_source TEXT DEFAULT NULL,
    utm_medium TEXT DEFAULT NULL,
    utm_campaign TEXT DEFAULT NULL,
    utm_term TEXT DEFAULT NULL,
    utm_content TEXT DEFAULT NULL,
    referrer TEXT DEFAULT NULL
)
RETURNS VOID 
SECURITY DEFINER -- 🔑 This is the key fix - allows bypassing RLS
SET search_path = public
AS $$
BEGIN
    INSERT INTO page_views (
        path,
        user_id,
        ip_address,
        user_agent,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        referrer
    ) VALUES (
        page_path,
        user_uuid,
        ip_addr,
        user_agent_string,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        referrer
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION record_page_view(TEXT, UUID, INET, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ============================================================================
-- VERIFICATION: Test that it works
-- ============================================================================

-- Test 1: Try to insert a view using the function
DO $$
DECLARE
    test_listing_id UUID := '3ba8cbf9-70ea-4adc-981d-758a8082cd42';
    result UUID;
BEGIN
    -- Try to insert a test view
    result := record_listing_view(
        test_listing_id,
        NULL,
        '127.0.0.1'::INET,
        'SQL Test - If you see this view, the fix worked!'
    );
    
    RAISE NOTICE 'SUCCESS! ✅ Inserted view with ID: %', result;
    RAISE NOTICE 'The fix is working - views will now be tracked!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED! ❌ Error: %', SQLERRM;
        RAISE NOTICE 'If you see this, there may be other issues.';
END $$;

-- Test 2: Check if the test view was recorded
SELECT 
    'Test View Check' as test_name,
    COUNT(*) as view_count,
    MAX(created_at) as most_recent_view,
    MAX(user_agent) as last_user_agent
FROM listing_views
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- ============================================================================
-- What this fixes:
-- ============================================================================
-- Before: Functions couldn't insert into listing_views/page_views due to RLS
-- After:  Functions use SECURITY DEFINER to bypass RLS and insert successfully
--
-- This is the same approach used by record_share_event in migration 028.
-- It's safe because the functions are controlled and only insert tracking data.
-- ============================================================================

-- 🎉 DONE! After running this:
-- 1. Refresh any listing page in your browser
-- 2. The view count should start incrementing
-- 3. Run this to verify:
--
--    SELECT COUNT(*) FROM listing_views 
--    WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';
--
-- 4. Refresh the listing page again and re-run the query
-- 5. The count should increase!

