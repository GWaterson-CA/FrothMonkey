-- Auto Bid Feature Migration
-- This implements TradeMe-style auto-bidding functionality

-- Create auto_bids table
CREATE TABLE auto_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    max_amount NUMERIC(12,2) NOT NULL CHECK (max_amount > 0),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Create index for efficient lookups
CREATE INDEX idx_auto_bids_listing_enabled ON auto_bids(listing_id, enabled) WHERE enabled = true;
CREATE INDEX idx_auto_bids_user_listing ON auto_bids(user_id, listing_id);

-- Add updated_at trigger
CREATE TRIGGER update_auto_bids_updated_at 
    BEFORE UPDATE ON auto_bids 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE auto_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_bids
CREATE POLICY "Users can view own auto bids" ON auto_bids
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto bids" ON auto_bids
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto bids" ON auto_bids
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto bids" ON auto_bids
    FOR DELETE USING (auth.uid() = user_id);

-- Function to process auto-bids after a manual bid is placed
-- This function is called after a successful bid to automatically bid for other users
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
    v_max_iterations INTEGER := 50; -- Prevent infinite loops
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
    
    -- Loop to process auto-bids (handles multiple auto-bidders competing)
    LOOP
        v_iteration := v_iteration + 1;
        
        -- Safety check: prevent infinite loops
        IF v_iteration > v_max_iterations THEN
            EXIT;
        END IF;
        
        -- Calculate the next minimum bid required
        v_required_min := next_min_bid(p_listing_id);
        
        -- Find the highest eligible auto-bid that:
        -- 1. Is not the current highest bidder
        -- 2. Has max_amount >= required minimum
        -- 3. Is enabled
        SELECT ab.* INTO v_auto_bid_record
        FROM auto_bids ab
        WHERE ab.listing_id = p_listing_id
          AND ab.enabled = true
          AND ab.user_id != v_current_highest_bidder
          AND ab.max_amount >= v_required_min
        ORDER BY ab.max_amount DESC, ab.created_at ASC
        LIMIT 1;
        
        -- If no eligible auto-bid found, exit
        IF NOT FOUND THEN
            EXIT;
        END IF;
        
        -- Place the auto-bid at the minimum required (not their max)
        -- This implements the TradeMe logic: "we'll place the next minimum bid for you"
        INSERT INTO bids (listing_id, bidder_id, amount)
        VALUES (p_listing_id, v_auto_bid_record.user_id, v_required_min);
        
        -- Update current price (reserve_met is auto-calculated as a generated column)
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

-- Updated place_bid function that integrates with auto-bidding
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
    
    -- Process auto-bids (other users' automatic counter-bids)
    -- This will automatically place bids for users who have auto-bid enabled
    -- and were outbid by this manual bid
    PERFORM process_auto_bids(listing_id, bidder);
    
    -- Get the final state after all auto-bids
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

-- Function to set or update an auto-bid
CREATE OR REPLACE FUNCTION set_auto_bid(
    p_user_id UUID,
    p_listing_id UUID,
    p_max_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_listing_record RECORD;
    v_current_price NUMERIC;
    v_required_min NUMERIC;
    v_current_highest_bidder UUID;
    v_auto_bid_id UUID;
BEGIN
    -- Get listing info
    SELECT * INTO v_listing_record
    FROM listings
    WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
    END IF;
    
    -- Check if listing is live
    IF v_listing_record.status != 'live' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not live');
    END IF;
    
    -- Check if user is the owner
    IF v_listing_record.owner_id = p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot bid on your own listing');
    END IF;
    
    -- Calculate minimum required bid
    v_required_min := next_min_bid(p_listing_id);
    
    -- Check if max amount is high enough
    IF p_max_amount < v_required_min THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Maximum bid amount must be at least the minimum required bid',
            'minimum_required', v_required_min
        );
    END IF;
    
    -- Get current highest bidder
    SELECT bidder_id INTO v_current_highest_bidder
    FROM bids
    WHERE listing_id = p_listing_id
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;
    
    -- Insert or update auto-bid
    INSERT INTO auto_bids (user_id, listing_id, max_amount, enabled)
    VALUES (p_user_id, p_listing_id, p_max_amount, true)
    ON CONFLICT (user_id, listing_id) 
    DO UPDATE SET 
        max_amount = p_max_amount,
        enabled = true,
        updated_at = NOW()
    RETURNING id INTO v_auto_bid_id;
    
    -- If user is NOT currently the highest bidder, immediately place a bid
    IF v_current_highest_bidder IS NULL OR v_current_highest_bidder != p_user_id THEN
        -- Place initial bid at minimum required
        INSERT INTO bids (listing_id, bidder_id, amount)
        VALUES (p_listing_id, p_user_id, v_required_min);
        
        -- Update listing price (reserve_met is auto-calculated as a generated column)
        UPDATE listings 
        SET current_price = v_required_min,
            updated_at = NOW()
        WHERE id = p_listing_id;
        
        -- Check anti-sniping
        IF v_listing_record.end_time - NOW() <= make_interval(secs := v_listing_record.anti_sniping_seconds) THEN
            UPDATE listings 
            SET end_time = end_time + INTERVAL '2 minutes'
            WHERE id = p_listing_id;
        END IF;
        
        -- Process other auto-bids (other users might auto-bid back)
        PERFORM process_auto_bids(p_listing_id, p_user_id);
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'auto_bid_id', v_auto_bid_id,
        'max_amount', p_max_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable/cancel an auto-bid
CREATE OR REPLACE FUNCTION cancel_auto_bid(
    p_user_id UUID,
    p_listing_id UUID
)
RETURNS JSONB AS $$
BEGIN
    UPDATE auto_bids
    SET enabled = false,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND listing_id = p_listing_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Auto-bid not found');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's auto-bid for a listing
CREATE OR REPLACE FUNCTION get_auto_bid(
    p_user_id UUID,
    p_listing_id UUID
)
RETURNS TABLE(
    id UUID,
    max_amount NUMERIC,
    enabled BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT ab.id, ab.max_amount, ab.enabled, ab.created_at, ab.updated_at
    FROM auto_bids ab
    WHERE ab.user_id = p_user_id 
      AND ab.listing_id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

