-- Enhanced analytics tracking for UTM parameters, referrer, and share events

-- Add UTM and referrer columns to page_views table
ALTER TABLE page_views 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Create share_events table
CREATE TABLE IF NOT EXISTS share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- nullable for anonymous users
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for share_events table
CREATE INDEX IF NOT EXISTS idx_share_events_created_at ON share_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_platform_created ON share_events(platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_listing_created ON share_events(listing_id, created_at DESC);

-- Create indexes for new UTM columns
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON page_views(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_utm_campaign ON page_views(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON page_views(referrer) WHERE referrer IS NOT NULL;

-- Update the record_page_view function to handle UTM parameters
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
RETURNS VOID AS $$
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

-- Create function to record share events
CREATE OR REPLACE FUNCTION record_share_event(
    platform_name TEXT,
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID AS $$
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

-- Update admin analytics function to include share events
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
    share_events_count INTEGER;
    top_utm_sources JSONB;
    top_referrers JSONB;
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
    
    -- Current bids count and value
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0)
    INTO current_bids_count, current_bids_value
    FROM bids
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Questions asked
    SELECT COUNT(*) INTO questions_asked
    FROM auction_questions
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Questions answered
    SELECT COUNT(*) INTO questions_answered
    FROM auction_questions
    WHERE answer IS NOT NULL 
    AND updated_at >= start_time AND updated_at <= end_time;
    
    -- Page views
    SELECT COUNT(*) INTO page_views_count
    FROM page_views
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Listing views
    SELECT COUNT(*) INTO listing_views_count
    FROM listing_views
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Share events
    SELECT COUNT(*) INTO share_events_count
    FROM share_events
    WHERE created_at >= start_time AND created_at <= end_time;
    
    -- Top UTM sources
    SELECT jsonb_agg(
        jsonb_build_object(
            'source', utm_source,
            'count', count
        ) ORDER BY count DESC
    ) INTO top_utm_sources
    FROM (
        SELECT utm_source, COUNT(*) as count
        FROM page_views
        WHERE utm_source IS NOT NULL
        AND created_at >= start_time AND created_at <= end_time
        GROUP BY utm_source
        ORDER BY count DESC
        LIMIT 10
    ) utm_stats;
    
    -- Top referrers
    SELECT jsonb_agg(
        jsonb_build_object(
            'referrer', referrer,
            'count', count
        ) ORDER BY count DESC
    ) INTO top_referrers
    FROM (
        SELECT referrer, COUNT(*) as count
        FROM page_views
        WHERE referrer IS NOT NULL
        AND created_at >= start_time AND created_at <= end_time
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
    ) referrer_stats;
    
    -- Build result
    result := jsonb_build_object(
        'total_users', total_users,
        'new_users', new_users,
        'total_listings', total_listings,
        'new_listings', new_listings,
        'current_bids_count', current_bids_count,
        'current_bids_value', current_bids_value,
        'questions_asked', questions_asked,
        'questions_answered', questions_answered,
        'page_views_count', page_views_count,
        'listing_views_count', listing_views_count,
        'share_events_count', share_events_count,
        'top_utm_sources', COALESCE(top_utm_sources, '[]'::jsonb),
        'top_referrers', COALESCE(top_referrers, '[]'::jsonb),
        'time_period', jsonb_build_object(
            'start', start_time,
            'end', end_time
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
