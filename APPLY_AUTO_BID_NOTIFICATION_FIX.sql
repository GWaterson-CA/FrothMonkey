-- =====================================================
-- FIX OUTBID NOTIFICATIONS FOR AUTO-BID FEATURE
-- =====================================================
-- Run this in Supabase SQL Editor to apply the fix
-- =====================================================

-- Migration: Fix outbid notifications for auto-bid feature
-- Issue: Users were getting notified for every auto-bid increment
-- Fix: Only notify users when their auto-bid limit has been exceeded
--
-- Scenario WITHOUT auto-bid:
-- User 1 bids $100
-- User 2 bids $150 → User 1 gets email ✅
--
-- Scenario WITH auto-bid (NEW BEHAVIOR):
-- Listing at $20
-- User A sets auto-bid max at $50 → User A is at $25
-- User B bids $30 → Auto-bid counters to $35 for User A → NO EMAIL to User A (still protected)
-- User B bids $40 → Auto-bid counters to $45 for User A → NO EMAIL to User A (still protected)
-- User B bids $60 → User A's auto-bid can't counter → EMAIL to User A ✅ (limit exceeded)

CREATE OR REPLACE FUNCTION notify_bid_placed()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    bidder_name TEXT;
    bid_count INTEGER;
    previous_highest_bid RECORD;
    previous_bidder_name TEXT;
    previous_bidder_auto_bid RECORD;
    should_notify_outbid BOOLEAN := false;
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
    -- BUT: Only if their auto-bid limit has been exceeded (or they don't have auto-bid)
    IF FOUND THEN
        -- Check if the previous bidder has an active auto-bid
        SELECT ab.* INTO previous_bidder_auto_bid
        FROM auto_bids ab
        WHERE ab.user_id = previous_highest_bid.bidder_id
            AND ab.listing_id = NEW.listing_id
            AND ab.enabled = true;
        
        IF FOUND THEN
            -- Previous bidder has auto-bid enabled
            -- Only notify if the NEW bid amount meets or exceeds their auto-bid max_amount
            -- This means their auto-bid has been exhausted/maxed out
            IF NEW.amount >= previous_bidder_auto_bid.max_amount THEN
                should_notify_outbid := true;
            END IF;
        ELSE
            -- Previous bidder does NOT have auto-bid enabled
            -- Notify them normally (they were outbid by a manual or auto-bid)
            should_notify_outbid := true;
        END IF;
        
        -- Send the notification if conditions are met
        IF should_notify_outbid THEN
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

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Auto-Bid Notification Fix Applied!' as message,
       'Users will now only be notified when their auto-bid limit is exceeded' as behavior;

-- Verify the function was updated
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'notify_bid_placed'
AND routine_schema = 'public';

-- =====================================================
-- TEST SCENARIOS
-- =====================================================
/*
To test this fix:

1. Create a test listing at $20
2. User A sets auto-bid max at $50
3. User B manually bids $30 → Auto-bid counters to $35 for User A
   ✅ User A should NOT receive an email (still protected by auto-bid)
   
4. User B manually bids $40 → Auto-bid counters to $45 for User A
   ✅ User A should NOT receive an email (still protected by auto-bid)
   
5. User B manually bids $60 → User A's auto-bid cannot counter
   ✅ User A SHOULD receive an email (auto-bid limit exceeded)
*/

