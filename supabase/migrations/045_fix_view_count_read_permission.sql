-- Fix get_listing_view_count to use SECURITY DEFINER
-- This allows the function to read view counts even with RLS enabled

DROP FUNCTION IF EXISTS get_listing_view_count(UUID);

CREATE OR REPLACE FUNCTION get_listing_view_count(listing_uuid UUID)
RETURNS INTEGER
SECURITY DEFINER -- 🔑 Allows bypassing RLS to read the count
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

