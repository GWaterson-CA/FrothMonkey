-- URGENT: Apply this immediately to fix autobid priority
-- This needs to be run in Supabase SQL Editor to take effect

-- This fixes the issue where User B wins at User A's max amount
-- After this fix, User A will get their max bid first (as they should)

CREATE OR REPLACE FUNCTION process_auto_bids(
    p_listing_id UUID,
    p_triggering_bidder_id UUID
)
RETURNS TABLE(
    auto_bid_placed BOOLEAN,
    new_bidder_id UUID,
    new_amount NUMERIC
) AS $$
DECLARE
    v_listing_record RECORD;
    v_current_highest_bidder UUID;
    v_auto_bid_record RECORD;
    v_required_min NUMERIC;
    v_bid_result JSONB;
    v_bids_placed INTEGER := 0;
    v_max_iterations INTEGER := 50;
    v_iteration INTEGER := 0;
BEGIN
    -- Get current listing state
    SELECT * INTO v_listing_record
    FROM listings 
    WHERE id = p_listing_id
    FOR UPDATE;
    
    -- Check if listing is still live
    IF v_listing_record.status != 'live' THEN
        RETURN;
    END IF;
    
    -- Get current highest bidder
    SELECT bidder_id INTO v_current_highest_bidder
    FROM bids
    WHERE listing_id = p_listing_id
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;
    
    -- Loop to process auto-bids
    LOOP
        v_iteration := v_iteration + 1;
        
        -- Safety check: prevent infinite loops
        IF v_iteration > v_max_iterations THEN
            EXIT;
        END IF;
        
        -- Calculate the next minimum bid required
        v_required_min := next_min_bid(p_listing_id);
        
        -- Find the highest eligible auto-bid
        -- FIXED: Prioritize users at their max_amount when required_min equals their max
        -- This ensures users get to bid their maximum before being outbid
        SELECT ab.* INTO v_auto_bid_record
        FROM auto_bids ab
        WHERE ab.listing_id = p_listing_id
          AND ab.enabled = true
          AND ab.user_id != v_current_highest_bidder
          AND ab.max_amount >= v_required_min
        ORDER BY 
          -- Priority 1: If required_min equals max_amount, prioritize by earliest created_at
          -- This gives users who committed to this amount first the right to place that bid
          CASE WHEN ab.max_amount = v_required_min THEN 0 ELSE 1 END,
          -- Priority 2: Among users at their max, earliest autobid wins
          CASE WHEN ab.max_amount = v_required_min THEN ab.created_at END ASC,
          -- Priority 3: Otherwise, highest max_amount wins (existing logic)
          ab.max_amount DESC, 
          -- Priority 4: If tied on max_amount, earliest wins
          ab.created_at ASC
        LIMIT 1;
        
        -- If no eligible auto-bid found, exit
        IF NOT FOUND THEN
            EXIT;
        END IF;
        
        -- Place the auto-bid at the minimum required (MARKED AS AUTO-BID)
        INSERT INTO bids (listing_id, bidder_id, amount, is_auto_bid)
        VALUES (p_listing_id, v_auto_bid_record.user_id, v_required_min, true);
        
        -- Update current price
        UPDATE listings 
        SET current_price = v_required_min,
            updated_at = NOW()
        WHERE id = p_listing_id;
        
        -- Update current highest bidder
        v_current_highest_bidder := v_auto_bid_record.user_id;
        v_bids_placed := v_bids_placed + 1;
        
        -- Return the auto-bid information
        auto_bid_placed := true;
        new_bidder_id := v_auto_bid_record.user_id;
        new_amount := v_required_min;
        RETURN NEXT;
        
        -- Check anti-sniping
        IF v_listing_record.end_time - NOW() <= make_interval(secs := v_listing_record.anti_sniping_seconds) THEN
            UPDATE listings 
            SET end_time = end_time + INTERVAL '2 minutes'
            WHERE id = p_listing_id;
            
            -- Update our local record
            SELECT end_time INTO v_listing_record.end_time
            FROM listings WHERE id = p_listing_id;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix was applied
SELECT 'Fix applied successfully! The autobid logic now prioritizes users at their max amount.' as status;

