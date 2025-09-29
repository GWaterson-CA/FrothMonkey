-- =====================================================
-- FIX place_bid Function - Remove Generated Column Update
-- =====================================================
-- Error: column "reserve_met" can only be updated to DEFAULT
-- The reserve_met column is GENERATED, so we can't set it manually
-- It will update automatically when we update current_price
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
    
    -- Insert the bid
    INSERT INTO bids (listing_id, bidder_id, amount)
    VALUES (listing_id, bidder, bid_amount);
    
    -- Update current price ONLY (reserve_met will auto-update since it's GENERATED)
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
    
    RETURN jsonb_build_object(
        'accepted', true,
        'new_highest', bid_amount,
        'end_time', listing_record.end_time
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! The reserve_met column will now update automatically
-- based on the current_price we set above
-- =====================================================

SELECT 'place_bid function updated!' as status,
       'Try placing a bid now - it should work!' as next_step;
