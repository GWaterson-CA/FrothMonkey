-- ⚠️ COMPLETE VIEW COUNT FIX - Run this entire file ⚠️
-- This fixes BOTH writing views AND reading view counts

-- ============================================================================
-- PART 1: Fix recording views (INSERT) - ALREADY APPLIED
-- ============================================================================
-- (Keeping this here for completeness, safe to run again)

DROP FUNCTION IF EXISTS record_listing_view(UUID, UUID, INET, TEXT);

CREATE OR REPLACE FUNCTION record_listing_view(
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER 
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

GRANT EXECUTE ON FUNCTION record_listing_view(UUID, UUID, INET, TEXT) TO authenticated, anon;

-- ============================================================================
-- PART 2: Fix reading view counts (SELECT) - THIS IS THE MISSING PIECE! 🔑
-- ============================================================================

DROP FUNCTION IF EXISTS get_listing_view_count(UUID);

CREATE OR REPLACE FUNCTION get_listing_view_count(listing_uuid UUID)
RETURNS INTEGER
SECURITY DEFINER -- 🔑 This allows reading the count even with RLS
SET search_path = public
AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM listing_views
    WHERE listing_id = listing_uuid;
    
    RETURN COALESCE(view_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION get_listing_view_count(UUID) TO authenticated, anon;

-- ============================================================================
-- VERIFICATION: Test both functions
-- ============================================================================

DO $$
DECLARE
    test_listing_id UUID := '3ba8cbf9-70ea-4adc-981d-758a8082cd42';
    insert_result UUID;
    read_result INTEGER;
BEGIN
    -- Test 1: Insert a view
    insert_result := record_listing_view(
        test_listing_id,
        NULL,
        '127.0.0.1'::INET,
        'Complete Fix Test'
    );
    
    RAISE NOTICE '✅ INSERT TEST PASSED - View ID: %', insert_result;
    
    -- Test 2: Read the count
    read_result := get_listing_view_count(test_listing_id);
    
    RAISE NOTICE '✅ READ TEST PASSED - View Count: %', read_result;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 BOTH TESTS PASSED! View count should now display on web pages!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TEST FAILED - Error: %', SQLERRM;
END $$;

-- Final verification query
SELECT 
    '=== FINAL CHECK ===' as status,
    get_listing_view_count('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as function_count,
    (SELECT COUNT(*) FROM listing_views WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42') as direct_count,
    CASE 
        WHEN get_listing_view_count('3ba8cbf9-70ea-4adc-981d-758a8082cd42') > 0 
        THEN '✅ VIEW COUNT WORKING!' 
        ELSE '⚠️ No views recorded yet'
    END as result;

-- ============================================================================
-- After running this SQL:
-- 1. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+F5)
-- 2. Visit any listing page
-- 3. The view count at the bottom should now display correctly!
-- 4. Each refresh should increment the count
-- ============================================================================

