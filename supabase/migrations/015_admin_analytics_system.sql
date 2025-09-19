-- Create analytics tracking tables for admin dashboard

-- Page views tracking table
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- nullable for anonymous users
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing views tracking table  
CREATE TABLE listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- nullable for anonymous users
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics tables
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_path_created ON page_views(path, created_at DESC);
CREATE INDEX idx_listing_views_created_at ON listing_views(created_at DESC);
CREATE INDEX idx_listing_views_listing_created ON listing_views(listing_id, created_at DESC);

-- Admin analytics functions
-- Function to get analytics data for a time period
CREATE OR REPLACE FUNCTION get_admin_analytics(
    start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INTEGER;
    new_users INTEGER;
    total_listings INTEGER;
    new_listings INTEGER;
    current_bids_count INTEGER;
    current_bids_value NUMERIC;
    questions_asked INTEGER;
    questions_answered INTEGER;
    page_views_count INTEGER;
    listing_views_count INTEGER;
BEGIN
    -- Total users
    SELECT COUNT(*) INTO total_users
    FROM profiles;
    
    -- New users in time period
    SELECT COUNT(*) INTO new_users
    FROM profiles
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Total listings
    SELECT COUNT(*) INTO total_listings
    FROM listings;
    
    -- New listings in time period
    SELECT COUNT(*) INTO new_listings
    FROM listings
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Current active bids count and value
    SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as value
    INTO current_bids_count, current_bids_value
    FROM bids b
    JOIN listings l ON b.listing_id = l.id
    WHERE l.status = 'live'
    AND b.created_at >= start_time AND b.created_at <= end_time;
    
    -- Questions asked in time period
    SELECT COUNT(*) INTO questions_asked
    FROM auction_questions
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Questions answered in time period
    SELECT COUNT(*) INTO questions_answered
    FROM auction_questions
    WHERE answered_at >= start_time AND answered_at <= end_time;
    
    -- Page views in time period
    SELECT COUNT(*) INTO page_views_count
    FROM page_views
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Listing views in time period
    SELECT COUNT(*) INTO listing_views_count
    FROM listing_views
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Build result JSON
    result := jsonb_build_object(
        'total_users', total_users,
        'new_users', new_users,
        'total_listings', total_listings,
        'new_listings', new_listings,
        'current_bids_count', current_bids_count,
        'current_bids_value', current_bids_value,
        'questions_asked', questions_asked,
        'questions_answered', questions_answered,
        'page_views', page_views_count,
        'listing_views', listing_views_count,
        'time_period', jsonb_build_object(
            'start_time', start_time,
            'end_time', end_time
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to record page view
CREATE OR REPLACE FUNCTION record_page_view(
    page_path TEXT,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    view_id UUID;
BEGIN
    INSERT INTO page_views (path, user_id, ip_address, user_agent)
    VALUES (page_path, user_uuid, ip_addr, user_agent_string)
    RETURNING id INTO view_id;
    
    RETURN view_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record listing view
CREATE OR REPLACE FUNCTION record_listing_view(
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    view_id UUID;
BEGIN
    INSERT INTO listing_views (listing_id, user_id, ip_address, user_agent)
    VALUES (listing_uuid, user_uuid, ip_addr, user_agent_string)
    RETURNING id INTO view_id;
    
    RETURN view_id;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for analytics tables
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

-- Only admins can view analytics data
CREATE POLICY "Admins can view all page views" ON page_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can view all listing views" ON listing_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can record page views" ON page_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can record listing views" ON listing_views
    FOR INSERT WITH CHECK (true);

-- Add admin deletion policies for listings and users
CREATE POLICY "Admins can delete any listing" ON listings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete any user profile" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Function to safely delete user and all related data
CREATE OR REPLACE FUNCTION admin_delete_user(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    deleted_listings INTEGER;
    deleted_bids INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Count items to be deleted
    SELECT COUNT(*) INTO deleted_listings FROM listings WHERE owner_id = user_uuid;
    SELECT COUNT(*) INTO deleted_bids FROM bids WHERE bidder_id = user_uuid;
    
    -- Delete user (cascade will handle related data)
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_listings', deleted_listings,
        'deleted_bids', deleted_bids,
        'user_id', user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to admin delete listing
CREATE OR REPLACE FUNCTION admin_delete_listing(listing_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    listing_title TEXT;
    deleted_bids INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;
    
    -- Get listing details
    SELECT title INTO listing_title FROM listings WHERE id = listing_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
    END IF;
    
    -- Count bids to be deleted
    SELECT COUNT(*) INTO deleted_bids FROM bids WHERE listing_id = listing_uuid;
    
    -- Delete listing (cascade will handle related data)
    DELETE FROM listings WHERE id = listing_uuid;
    
    RETURN jsonb_build_object(
        'success', true,
        'listing_title', listing_title,
        'deleted_bids', deleted_bids,
        'listing_id', listing_uuid
    );
END;
$$ LANGUAGE plpgsql;
