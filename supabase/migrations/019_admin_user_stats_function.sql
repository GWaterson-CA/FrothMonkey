-- Create comprehensive user statistics function for admin panel
CREATE OR REPLACE FUNCTION get_admin_user_stats()
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ,
    email TEXT,
    total_listings BIGINT,
    active_listings BIGINT,
    sold_listings BIGINT,
    total_sales_value NUMERIC,
    total_bids_placed BIGINT,
    total_bid_value NUMERIC,
    times_reported BIGINT,
    average_rating NUMERIC,
    review_count BIGINT,
    last_active TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_admin,
        p.created_at,
        au.email,
        
        -- Listing statistics
        COALESCE(ls.total_listings, 0) as total_listings,
        COALESCE(ls.active_listings, 0) as active_listings,
        COALESCE(ls.sold_listings, 0) as sold_listings,
        COALESCE(ls.total_sales_value, 0) as total_sales_value,
        
        -- Bidding statistics
        COALESCE(bs.total_bids_placed, 0) as total_bids_placed,
        COALESCE(bs.total_bid_value, 0) as total_bid_value,
        
        -- Report statistics
        COALESCE(rs.times_reported, 0) as times_reported,
        
        -- Review statistics
        COALESCE(revs.average_rating, 0) as average_rating,
        COALESCE(revs.review_count, 0) as review_count,
        
        -- Last activity (most recent of: listing created, bid placed, question asked)
        GREATEST(
            COALESCE(ls.last_listing, p.created_at),
            COALESCE(bs.last_bid, p.created_at),
            COALESCE(qs.last_question, p.created_at)
        ) as last_active
        
    FROM profiles p
    
    -- Join with auth.users to get email (need to be careful with security)
    LEFT JOIN auth.users au ON p.id = au.id
    
    -- Listing statistics subquery
    LEFT JOIN (
        SELECT 
            owner_id,
            COUNT(*) as total_listings,
            COUNT(CASE WHEN status IN ('live', 'scheduled') THEN 1 END) as active_listings,
            COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings,
            COALESCE(SUM(CASE WHEN status = 'sold' THEN current_price END), 0) as total_sales_value,
            MAX(created_at) as last_listing
        FROM listings
        GROUP BY owner_id
    ) ls ON p.id = ls.owner_id
    
    -- Bidding statistics subquery
    LEFT JOIN (
        SELECT 
            bidder_id,
            COUNT(*) as total_bids_placed,
            COALESCE(SUM(amount), 0) as total_bid_value,
            MAX(created_at) as last_bid
        FROM bids
        GROUP BY bidder_id
    ) bs ON p.id = bs.bidder_id
    
    -- Report statistics subquery (from listing_reports where they are the listing owner)
    LEFT JOIN (
        SELECT 
            l.owner_id,
            COUNT(*) as times_reported
        FROM listing_reports lr
        JOIN listings l ON lr.listing_id = l.id
        WHERE lr.status != 'resolved' -- Only count unresolved reports
        GROUP BY l.owner_id
    ) rs ON p.id = rs.owner_id
    
    -- Review statistics subquery (reviews they have received)
    LEFT JOIN (
        SELECT 
            reviewee_id,
            AVG(rating) as average_rating,
            COUNT(*) as review_count
        FROM user_reviews
        GROUP BY reviewee_id
    ) revs ON p.id = revs.reviewee_id
    
    -- Questions statistics subquery (for last activity)
    LEFT JOIN (
        SELECT 
            questioner_id,
            MAX(created_at) as last_question
        FROM auction_questions
        GROUP BY questioner_id
    ) qs ON p.id = qs.questioner_id
    
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (admin check is done in the API)
GRANT EXECUTE ON FUNCTION get_admin_user_stats() TO authenticated;

-- Create function to get user details including email (for admin use)
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RETURN NULL; -- Don't return email if not admin
    END IF;
    
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$$;
