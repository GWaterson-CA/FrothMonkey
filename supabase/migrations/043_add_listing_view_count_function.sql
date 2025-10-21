-- Add function to get listing view count
-- This function counts the total views for a specific listing

CREATE OR REPLACE FUNCTION get_listing_view_count(listing_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM listing_views
    WHERE listing_id = listing_uuid;
    
    RETURN COALESCE(view_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create an index to optimize view count queries if not already exists
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);

