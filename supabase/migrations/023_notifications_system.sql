-- Create notifications table
CREATE TABLE notifications (
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

-- Create indexes for performance
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_listing ON notifications(listing_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Helper function to create a notification
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
BEGIN
    INSERT INTO notifications (user_id, type, title, message, listing_id, related_user_id, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_listing_id, p_related_user_id, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Notify seller when question is asked
CREATE OR REPLACE FUNCTION notify_question_received()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    questioner_name TEXT;
BEGIN
    -- Get listing owner and title
    SELECT owner_id, title INTO listing_owner, listing_title
    FROM listings WHERE id = NEW.listing_id;
    
    -- Get questioner name
    SELECT COALESCE(full_name, username, 'Someone') INTO questioner_name
    FROM profiles WHERE id = NEW.questioner_id;
    
    -- Create notification for seller
    PERFORM create_notification(
        listing_owner,
        'question_received',
        'New Question on Your Listing',
        questioner_name || ' asked a question about "' || listing_title || '"',
        NEW.listing_id,
        NEW.questioner_id,
        jsonb_build_object('question_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_question_received
    AFTER INSERT ON auction_questions
    FOR EACH ROW
    EXECUTE FUNCTION notify_question_received();

-- Trigger: Notify seller on first bid and notify previous bidder when outbid
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
                'You\'ve Been Outbid!',
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

CREATE TRIGGER trigger_notify_bid_placed
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_bid_placed();

-- Trigger: Notify when reserve price is met
CREATE OR REPLACE FUNCTION notify_reserve_met()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    watcher RECORD;
BEGIN
    -- Only proceed if reserve was just met (wasn't met before but is now)
    IF OLD.reserve_met = FALSE AND NEW.reserve_met = TRUE THEN
        SELECT owner_id, title INTO listing_owner, listing_title
        FROM listings WHERE id = NEW.id;
        
        -- Notify seller
        PERFORM create_notification(
            listing_owner,
            'reserve_met',
            'Reserve Price Met!',
            'The reserve price has been met on "' || listing_title || '"',
            NEW.id,
            NULL,
            jsonb_build_object('current_price', NEW.current_price, 'reserve_price', NEW.reserve_price)
        );
        
        -- Notify all users who have this listing in their watchlist
        FOR watcher IN 
            SELECT DISTINCT user_id 
            FROM watchlists 
            WHERE listing_id = NEW.id AND user_id != listing_owner
        LOOP
            PERFORM create_notification(
                watcher.user_id,
                'reserve_met',
                'Reserve Met on Watched Listing',
                'The reserve price has been met on "' || listing_title || '"',
                NEW.id,
                NULL,
                jsonb_build_object('current_price', NEW.current_price)
            );
        END LOOP;
        
        -- Notify all bidders (excluding the seller)
        FOR watcher IN 
            SELECT DISTINCT bidder_id 
            FROM bids 
            WHERE listing_id = NEW.id AND bidder_id != listing_owner
        LOOP
            -- Only notify if not already notified via watchlist
            IF NOT EXISTS (
                SELECT 1 FROM watchlists 
                WHERE listing_id = NEW.id AND user_id = watcher.bidder_id
            ) THEN
                PERFORM create_notification(
                    watcher.bidder_id,
                    'reserve_met',
                    'Reserve Met on Auction You\'re Bidding On',
                    'The reserve price has been met on "' || listing_title || '"',
                    NEW.id,
                    NULL,
                    jsonb_build_object('current_price', NEW.current_price)
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_reserve_met
    AFTER UPDATE ON listings
    FOR EACH ROW
    WHEN (OLD.reserve_met IS DISTINCT FROM NEW.reserve_met)
    EXECUTE FUNCTION notify_reserve_met();

-- Trigger: Notify when listing is reported
CREATE OR REPLACE FUNCTION notify_listing_reported()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
BEGIN
    -- Get listing details
    SELECT owner_id, title INTO listing_owner, listing_title
    FROM listings WHERE id = NEW.listing_id;
    
    -- Notify seller
    PERFORM create_notification(
        listing_owner,
        'listing_reported',
        'Your Listing Has Been Reported',
        'Your listing "' || listing_title || '" has been reported for: ' || NEW.reason,
        NEW.listing_id,
        NEW.reporter_id,
        jsonb_build_object('report_id', NEW.id, 'reason', NEW.reason)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_listing_reported
    AFTER INSERT ON listing_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_listing_reported();

-- Trigger: Notify when listing ends
CREATE OR REPLACE FUNCTION notify_listing_ended()
RETURNS TRIGGER AS $$
DECLARE
    listing_title TEXT;
    bid_count INTEGER;
    highest_bidder UUID;
    highest_bid_amount NUMERIC;
    outcome TEXT;
    watcher RECORD;
BEGIN
    -- Only trigger when status changes to 'ended' or 'sold'
    IF (OLD.status = 'live' AND NEW.status IN ('ended', 'sold')) THEN
        SELECT title INTO listing_title FROM listings WHERE id = NEW.id;
        
        -- Count bids
        SELECT COUNT(*) INTO bid_count FROM bids WHERE listing_id = NEW.id;
        
        -- Get highest bidder if there are bids
        IF bid_count > 0 THEN
            SELECT bidder_id, amount INTO highest_bidder, highest_bid_amount
            FROM bids 
            WHERE listing_id = NEW.id
            ORDER BY amount DESC, created_at ASC
            LIMIT 1;
        END IF;
        
        -- Determine outcome
        IF NEW.status = 'sold' THEN
            IF NEW.current_price >= NEW.buy_now_price THEN
                outcome := 'sold_buy_now';
            ELSE
                outcome := 'sold_reserve_met';
            END IF;
        ELSIF bid_count = 0 THEN
            outcome := 'ended_no_bids';
        ELSIF NOT NEW.reserve_met THEN
            outcome := 'ended_reserve_not_met';
        ELSE
            outcome := 'ended_other';
        END IF;
        
        -- Notify seller
        CASE outcome
            WHEN 'sold_buy_now' THEN
                PERFORM create_notification(
                    NEW.owner_id,
                    'listing_ended',
                    'Listing Sold via Buy Now!',
                    '"' || listing_title || '" sold for $' || NEW.current_price || ' via Buy Now',
                    NEW.id,
                    highest_bidder,
                    jsonb_build_object('outcome', outcome, 'final_price', NEW.current_price)
                );
            WHEN 'sold_reserve_met' THEN
                PERFORM create_notification(
                    NEW.owner_id,
                    'listing_ended',
                    'Listing Sold!',
                    '"' || listing_title || '" sold for $' || NEW.current_price,
                    NEW.id,
                    highest_bidder,
                    jsonb_build_object('outcome', outcome, 'final_price', NEW.current_price)
                );
            WHEN 'ended_no_bids' THEN
                PERFORM create_notification(
                    NEW.owner_id,
                    'listing_ended',
                    'Listing Ended',
                    '"' || listing_title || '" ended with no bids',
                    NEW.id,
                    NULL,
                    jsonb_build_object('outcome', outcome)
                );
            WHEN 'ended_reserve_not_met' THEN
                PERFORM create_notification(
                    NEW.owner_id,
                    'listing_ended',
                    'Listing Ended',
                    '"' || listing_title || '" ended with bids, but reserve price was not met (highest bid: $' || NEW.current_price || ')',
                    NEW.id,
                    highest_bidder,
                    jsonb_build_object('outcome', outcome, 'highest_bid', NEW.current_price)
                );
            ELSE
                PERFORM create_notification(
                    NEW.owner_id,
                    'listing_ended',
                    'Listing Ended',
                    '"' || listing_title || '" has ended',
                    NEW.id,
                    NULL,
                    jsonb_build_object('outcome', outcome)
                );
        END CASE;
        
        -- Notify winner if sold
        IF NEW.status = 'sold' AND highest_bidder IS NOT NULL THEN
            PERFORM create_notification(
                highest_bidder,
                'auction_won',
                'Congratulations! You Won!',
                'You won the auction for "' || listing_title || '" with a bid of $' || highest_bid_amount,
                NEW.id,
                NEW.owner_id,
                jsonb_build_object('winning_bid', highest_bid_amount)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_listing_ended
    AFTER UPDATE ON listings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_listing_ended();

-- Function to create time-based notifications (called by scheduled job)
CREATE OR REPLACE FUNCTION create_time_warning_notifications()
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    listing_record RECORD;
    bidder RECORD;
    watcher RECORD;
    listing_title TEXT;
BEGIN
    -- Find listings ending in 24 hours (23.5 to 24.5 hours window)
    FOR listing_record IN 
        SELECT id, owner_id, title, end_time
        FROM listings 
        WHERE status = 'live' 
            AND end_time > NOW() + INTERVAL '23 hours 30 minutes'
            AND end_time <= NOW() + INTERVAL '24 hours 30 minutes'
    LOOP
        -- Notify all bidders
        FOR bidder IN 
            SELECT DISTINCT bidder_id 
            FROM bids 
            WHERE listing_id = listing_record.id
        LOOP
            -- Only create if not already notified about 24h
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = bidder.bidder_id 
                    AND listing_id = listing_record.id 
                    AND type = 'time_warning_24h'
            ) THEN
                PERFORM create_notification(
                    bidder.bidder_id,
                    'time_warning_24h',
                    'Auction Ending Soon',
                    '"' || listing_record.title || '" ends in 24 hours',
                    listing_record.id,
                    NULL,
                    jsonb_build_object('hours_remaining', 24, 'end_time', listing_record.end_time)
                );
                notification_count := notification_count + 1;
            END IF;
        END LOOP;
        
        -- Notify all watchers (who aren't bidders)
        FOR watcher IN 
            SELECT DISTINCT user_id 
            FROM watchlists 
            WHERE listing_id = listing_record.id
                AND NOT EXISTS (
                    SELECT 1 FROM bids 
                    WHERE listing_id = listing_record.id 
                        AND bidder_id = watchlists.user_id
                )
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = watcher.user_id 
                    AND listing_id = listing_record.id 
                    AND type = 'time_warning_24h'
            ) THEN
                PERFORM create_notification(
                    watcher.user_id,
                    'time_warning_24h',
                    'Watched Auction Ending Soon',
                    '"' || listing_record.title || '" ends in 24 hours',
                    listing_record.id,
                    NULL,
                    jsonb_build_object('hours_remaining', 24, 'end_time', listing_record.end_time)
                );
                notification_count := notification_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Find listings ending in 2 hours (1.5 to 2.5 hours window)
    FOR listing_record IN 
        SELECT id, owner_id, title, end_time
        FROM listings 
        WHERE status = 'live' 
            AND end_time > NOW() + INTERVAL '1 hour 30 minutes'
            AND end_time <= NOW() + INTERVAL '2 hours 30 minutes'
    LOOP
        -- Notify all bidders
        FOR bidder IN 
            SELECT DISTINCT bidder_id 
            FROM bids 
            WHERE listing_id = listing_record.id
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = bidder.bidder_id 
                    AND listing_id = listing_record.id 
                    AND type = 'time_warning_2h'
            ) THEN
                PERFORM create_notification(
                    bidder.bidder_id,
                    'time_warning_2h',
                    'Auction Ending Very Soon!',
                    '"' || listing_record.title || '" ends in 2 hours',
                    listing_record.id,
                    NULL,
                    jsonb_build_object('hours_remaining', 2, 'end_time', listing_record.end_time)
                );
                notification_count := notification_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_time_warning_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID, JSONB) TO service_role;

-- Add notification preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
    'email_notifications', true,
    'question_received', true,
    'first_bid_received', true,
    'reserve_met', true,
    'listing_ended', true,
    'listing_reported', true,
    'bid_outbid', true,
    'auction_won', true,
    'time_warning_24h', true,
    'time_warning_2h', true
);

