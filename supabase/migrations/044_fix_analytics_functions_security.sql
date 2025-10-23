-- Fix analytics functions to use SECURITY DEFINER to bypass RLS
-- This ensures that view tracking works even with RLS enabled

-- Drop and recreate record_listing_view with SECURITY DEFINER
DROP FUNCTION IF EXISTS record_listing_view(UUID, UUID, INET, TEXT);

CREATE OR REPLACE FUNCTION record_listing_view(
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER -- This allows the function to bypass RLS
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

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION record_listing_view(UUID, UUID, INET, TEXT) TO authenticated, anon;

-- Also fix record_page_view for consistency
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
SECURITY DEFINER -- This allows the function to bypass RLS
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

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION record_page_view(TEXT, UUID, INET, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

