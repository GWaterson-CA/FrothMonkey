-- Simple admin function to get all users (bypasses RLS)
-- This can be applied immediately to fix the admin panel

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ) THEN
        -- If not admin, return empty result
        RETURN;
    END IF;

    -- Return all users for admin
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_admin,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
