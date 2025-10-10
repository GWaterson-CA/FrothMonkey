-- Migration: Fix outbid notification frequency
-- Issue: Users only received ONE outbid email per listing
-- Fix: Users now receive an email EACH TIME they are outbid
-- 
-- Scenario:
-- User 1 bids $100
-- User 2 bids $150 → User 1 gets email ✅
-- User 1 bids $200 → User 2 gets email ✅
-- User 2 bids $250 → User 1 gets email ✅
-- User 1 bids $300 → User 2 gets email ✅

-- Drop and recreate the notify_bid_placed function without the "only once per listing" check
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
    
    -- Notify previous highest bidder that they've been outbid
    -- REMOVED: The "only first time" check that prevented multiple notifications
    -- Now sends a notification EVERY TIME a user is outbid
    IF FOUND THEN
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists from previous migrations, no need to recreate it
-- trigger_notify_bid_placed ON bids AFTER INSERT FOR EACH ROW EXECUTE FUNCTION notify_bid_placed()

