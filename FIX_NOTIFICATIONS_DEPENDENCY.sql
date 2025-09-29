-- =====================================================
-- FIX BIDDING ERROR - Apply Notifications Dependencies
-- =====================================================
-- This creates the notifications system that place_bid needs
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'question_received',
        'first_bid_received',
        'reserve_met',
        'listing_ended',
        'listing_reported',
        'bid_outbid',
        'auction_won',
        'time_warning_24h',
        'time_warning_2h'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_listing ON notifications(listing_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_listing_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    user_preferences JSONB;
BEGIN
    -- Get user notification preferences
    SELECT notification_preferences INTO user_preferences
    FROM profiles
    WHERE id = p_user_id;
    
    -- Default to all enabled if preferences not set
    IF user_preferences IS NULL THEN
        user_preferences := '{"email": true, "push": true}'::jsonb;
    END IF;
    
    -- Check if this notification type is enabled for the user
    -- For now, we just create all notifications (filtering can be done on frontend)
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        listing_id,
        related_user_id,
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_listing_id,
        p_related_user_id,
        p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for bid notifications
CREATE OR REPLACE FUNCTION notify_bid_placed()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    bidder_name TEXT;
    bid_count INTEGER;
    previous_highest_bid RECORD;
    previous_bidder_name TEXT;
BEGIN
    -- Get listing details
    SELECT owner_id, title INTO listing_owner, listing_title
    FROM listings WHERE id = NEW.listing_id;
    
    -- Get bidder name
    SELECT COALESCE(full_name, username, 'A bidder') INTO bidder_name
    FROM profiles WHERE id = NEW.bidder_id;
    
    -- Count total bids on this listing
    SELECT COUNT(*) INTO bid_count
    FROM bids WHERE listing_id = NEW.listing_id;
    
    -- Notify seller on first bid
    IF bid_count = 1 THEN
        PERFORM create_notification(
            listing_owner,
            'first_bid_received',
            'First Bid Received!',
            bidder_name || ' placed the first bid of $' || NEW.amount || ' on "' || listing_title || '"',
            NEW.listing_id,
            NEW.bidder_id,
            jsonb_build_object('bid_amount', NEW.amount)
        );
    END IF;
    
    -- Find the previous highest bidder (excluding the current bidder)
    SELECT b.bidder_id, b.amount INTO previous_highest_bid
    FROM bids b
    WHERE b.listing_id = NEW.listing_id 
        AND b.bidder_id != NEW.bidder_id
        AND b.id != NEW.id
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;
    
    -- Notify previous highest bidder that they've been outbid (only first time)
    IF FOUND THEN
        -- Check if this bidder has already been notified about being outbid on this listing
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = previous_highest_bid.bidder_id 
                AND listing_id = NEW.listing_id 
                AND type = 'bid_outbid'
        ) THEN
            SELECT COALESCE(full_name, username, 'Another bidder') INTO previous_bidder_name
            FROM profiles WHERE id = previous_highest_bid.bidder_id;
            
            PERFORM create_notification(
                previous_highest_bid.bidder_id,
                'bid_outbid',
                'You''ve Been Outbid!',
                'Your bid of $' || previous_highest_bid.amount || ' on "' || listing_title || '" has been outbid',
                NEW.listing_id,
                NEW.bidder_id,
                jsonb_build_object('previous_bid', previous_highest_bid.amount, 'new_bid', NEW.amount)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_notify_bid_placed ON bids;

CREATE TRIGGER trigger_notify_bid_placed
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_bid_placed();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Setup Complete!' as message,
       'You can now place bids successfully!' as next_step;

-- Verify trigger exists
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_bid_placed';

-- =====================================================
-- Now go try placing a bid - it should work!
-- =====================================================
