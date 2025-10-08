-- Fix RLS security issues identified by Supabase Security Advisor
-- Issue 1: categories table has policies but RLS not enabled
-- Issue 2: share_events table doesn't have RLS enabled

-- Enable RLS on categories table (policies already exist from migration 006)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on share_events table
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for share_events
-- Since share events are for analytics tracking, we need to allow:
-- 1. The RPC function to insert (via SECURITY DEFINER)
-- 2. Admins to read for analytics

-- Drop any existing policies first
DROP POLICY IF EXISTS "Admins can view share events" ON share_events;
DROP POLICY IF EXISTS "Service role can insert share events" ON share_events;

-- Allow admins to view all share events for analytics
CREATE POLICY "Admins can view share events" ON share_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Note: The record_share_event function should be created with SECURITY DEFINER
-- to allow inserts regardless of RLS. Let's recreate it to ensure it's set correctly.
DROP FUNCTION IF EXISTS record_share_event(TEXT, UUID, UUID, INET, TEXT);

CREATE OR REPLACE FUNCTION record_share_event(
    platform_name TEXT,
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID 
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    INSERT INTO share_events (
        platform,
        listing_id,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        platform_name,
        listing_uuid,
        user_uuid,
        ip_addr,
        user_agent_string
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION record_share_event(TEXT, UUID, UUID, INET, TEXT) TO authenticated, anon;

