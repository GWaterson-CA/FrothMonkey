-- Fix for view count display showing 0 even though database has views
-- The issue: get_listing_view_count() also needs SECURITY DEFINER to read the data

-- Drop and recreate with SECURITY DEFINER
DROP FUNCTION IF EXISTS get_listing_view_count(UUID);

CREATE OR REPLACE FUNCTION get_listing_view_count(listing_uuid UUID)
RETURNS INTEGER
SECURITY DEFINER -- 🔑 This allows reading the view count data
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

-- Grant execute permission to everyone (authenticated and anonymous)
GRANT EXECUTE ON FUNCTION get_listing_view_count(UUID) TO authenticated, anon;

-- Test it immediately
SELECT 
    'Testing get_listing_view_count' as test,
    get_listing_view_count('3ba8cbf9-70ea-4adc-981d-758a8082cd42') as view_count,
    (SELECT COUNT(*) FROM listing_views WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42') as direct_count;

-- If view_count matches direct_count, the fix worked!
-- Now refresh your listing page and the count should display correctly

