-- =====================================================
-- URGENT FIX: Restore process_auto_bids call in place_bid
-- =====================================================
-- Run this immediately in Supabase SQL Editor
-- 
-- Problem: Migration 025_remove_duplicate_place_bid.sql overwrote place_bid
--          without preserving the process_auto_bids call from migration 038
-- 
-- This ensures autobids trigger correctly when manual bids are placed
-- =====================================================

CREATE OR REPLACE FUNCTION place_bid(
    listing_id UUID,
    bid_amount NUMERIC,
    bidder UUID
)
RETURNS JSONB AS $$
DECLARE
    listing_record RECORD;
    required_min NUMERIC;
    result JSONB;
    auto_bid_results RECORD;
    final_highest_amount NUMERIC;
    final_end_time TIMESTAMPTZ;
BEGIN
    -- Lock the listing row for update
    SELECT * INTO listing_record
    FROM listings 
    WHERE id = listing_id
    FOR UPDATE;
    
    -- Check if listing exists and is live
    IF NOT FOUND THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Listing not found');
    END IF;
    
    IF listing_record.status != 'live' THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Auction is not live');
    END IF;
    
    IF NOW() < listing_record.start_time OR NOW() > listing_record.end_time THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Auction is not active');
    END IF;
    
    -- Calculate required minimum bid
    required_min := next_min_bid(listing_id);
    
    -- Handle Buy Now scenario - only allow if reserve not yet met
    IF listing_record.buy_now_enabled 
       AND NOT listing_record.reserve_met 
       AND bid_amount >= listing_record.buy_now_price THEN
        -- Insert bid at buy now price
        INSERT INTO bids (listing_id, bidder_id, amount)
        VALUES (listing_id, bidder, listing_record.buy_now_price);
        
        -- Update listing
        UPDATE listings 
        SET current_price = listing_record.buy_now_price,
            status = 'sold',
            updated_at = NOW()
        WHERE id = listing_id;
        
        -- Create transaction
        INSERT INTO transactions (listing_id, buyer_id, final_price)
        VALUES (listing_id, bidder, listing_record.buy_now_price);
        
        -- Disable all auto-bids for this listing since it's sold
        UPDATE auto_bids
        SET enabled = false
        WHERE listing_id = listing_id;
        
        RETURN jsonb_build_object(
            'accepted', true,
            'buy_now', true,
            'new_highest', listing_record.buy_now_price,
            'end_time', listing_record.end_time
        );
    END IF;
    
    -- Check if user is trying to Buy Now when reserve is met
    IF listing_record.buy_now_enabled 
       AND listing_record.reserve_met 
       AND bid_amount >= listing_record.buy_now_price THEN
        RETURN jsonb_build_object(
            'accepted', false, 
            'reason', 'Buy Now is no longer available - reserve price has been reached'
        );
    END IF;
    
    -- Regular bid validation
    IF bid_amount < required_min THEN
        RETURN jsonb_build_object(
            'accepted', false, 
            'reason', 'Bid amount too low',
            'minimum_required', required_min
        );
    END IF;
    
    -- Insert the manual bid
    INSERT INTO bids (listing_id, bidder_id, amount)
    VALUES (listing_id, bidder, bid_amount);
    
    -- Update current price (reserve_met is auto-calculated as a generated column)
    UPDATE listings 
    SET current_price = bid_amount,
        updated_at = NOW()
    WHERE id = listing_id;
    
    -- Anti-sniping: extend end time if bid is placed in final seconds
    IF listing_record.end_time - NOW() <= make_interval(secs := listing_record.anti_sniping_seconds) THEN
        UPDATE listings 
        SET end_time = end_time + INTERVAL '2 minutes'
        WHERE id = listing_id;
        
        -- Get updated end time
        SELECT end_time INTO listing_record.end_time
        FROM listings WHERE id = listing_id;
    END IF;
    
    -- ============================================
    -- CRITICAL: Process auto-bids after manual bid
    -- ============================================
    -- This will automatically place bids for users who have auto-bid enabled
    -- and were outbid by this manual bid
    PERFORM process_auto_bids(listing_id, bidder);
    
    -- Get the final state after all auto-bids have been processed
    SELECT current_price, end_time INTO final_highest_amount, final_end_time
    FROM listings
    WHERE id = listing_id;
    
    RETURN jsonb_build_object(
        'accepted', true,
        'new_highest', final_highest_amount,
        'end_time', final_end_time,
        'manual_bid_amount', bid_amount
    );
END;
$$ LANGUAGE plpgsql;

-- Verify the fix was applied
SELECT 
    CASE 
        WHEN prosrc LIKE '%process_auto_bids%' THEN 
            '✅ SUCCESS: place_bid now calls process_auto_bids'
        ELSE 
            '❌ ERROR: place_bid still does NOT call process_auto_bids'
    END as verification_status
FROM pg_proc 
WHERE proname = 'place_bid'
  AND pg_get_function_identity_arguments(oid) = 'listing_id uuid, bid_amount numeric, bidder uuid'
LIMIT 1;

