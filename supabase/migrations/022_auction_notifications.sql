-- Create notifications table for auction completion notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('auction_won', 'auction_sold', 'auction_ended_no_reserve', 'auction_ended_no_bids')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to create auction completion notifications
CREATE OR REPLACE FUNCTION create_auction_notifications(
    listing_uuid UUID,
    final_status TEXT,
    winner_uuid UUID DEFAULT NULL,
    seller_uuid UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    listing_record RECORD;
    winner_record RECORD;
    seller_record RECORD;
BEGIN
    -- Get listing details
    SELECT * INTO listing_record
    FROM listings 
    WHERE id = listing_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found: %', listing_uuid;
    END IF;
    
    -- Get seller details
    SELECT * INTO seller_record
    FROM profiles 
    WHERE id = listing_record.owner_id;
    
    -- Get winner details if provided
    IF winner_uuid IS NOT NULL THEN
        SELECT * INTO winner_record
        FROM profiles 
        WHERE id = winner_uuid;
    END IF;
    
    -- Create notifications based on final status
    IF final_status = 'sold' AND winner_uuid IS NOT NULL THEN
        -- Notify winner
        INSERT INTO notifications (user_id, type, title, message, listing_id)
        VALUES (
            winner_uuid,
            'auction_won',
            'Congratulations! You won the auction',
            'You won the auction for "' || listing_record.title || '" with a bid of $' || listing_record.current_price || '. Please contact the seller to arrange payment and pickup.',
            listing_uuid
        );
        
        -- Notify seller
        INSERT INTO notifications (user_id, type, title, message, listing_id)
        VALUES (
            seller_record.id,
            'auction_sold',
            'Your auction sold!',
            'Your auction "' || listing_record.title || '" sold for $' || listing_record.current_price || ' to @' || COALESCE(winner_record.username, 'Unknown') || '. Please contact the buyer to arrange payment and pickup.',
            listing_uuid
        );
        
    ELSIF final_status = 'ended' AND listing_record.reserve_price IS NOT NULL AND NOT listing_record.reserve_met THEN
        -- Reserve not met - notify seller only
        INSERT INTO notifications (user_id, type, title, message, listing_id)
        VALUES (
            seller_record.id,
            'auction_ended_no_reserve',
            'Auction ended - reserve not met',
            'Your auction "' || listing_record.title || '" ended but did not meet the reserve price of $' || listing_record.reserve_price || '. The highest bid was $' || listing_record.current_price || '. You can contact the highest bidder if you wish to negotiate.',
            listing_uuid
        );
        
    ELSIF final_status = 'ended' THEN
        -- No bids - notify seller only
        INSERT INTO notifications (user_id, type, title, message, listing_id)
        VALUES (
            seller_record.id,
            'auction_ended_no_bids',
            'Auction ended with no bids',
            'Your auction "' || listing_record.title || '" ended with no bids. You can relist the item or adjust your pricing.',
            listing_uuid
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION create_auction_notifications(UUID, TEXT, UUID, UUID) TO service_role;

-- Update the finalize_auctions function to include notifications
CREATE OR REPLACE FUNCTION finalize_auctions(batch_limit INTEGER DEFAULT 200)
RETURNS INTEGER AS $$
DECLARE
    finalized_count INTEGER := 0;
    listing_record RECORD;
    highest_bid RECORD;
    winner_uuid UUID;
BEGIN
    -- Find auctions that need to be finalized
    FOR listing_record IN 
        SELECT id, owner_id, current_price, reserve_met, buy_now_enabled, reserve_price, title
        FROM listings 
        WHERE status = 'live' 
          AND NOW() >= end_time
        LIMIT batch_limit
    LOOP
        -- Find highest bid for this listing
        SELECT bidder_id, amount INTO highest_bid
        FROM bids 
        WHERE listing_id = listing_record.id
        ORDER BY amount DESC, created_at ASC
        LIMIT 1;
        
        winner_uuid := NULL;
        
        IF NOT FOUND THEN
            -- No bids, mark as ended
            UPDATE listings 
            SET status = 'ended', updated_at = NOW()
            WHERE id = listing_record.id;
            
            -- Create notification for seller
            PERFORM create_auction_notifications(
                listing_record.id,
                'ended',
                NULL,
                listing_record.owner_id
            );
        ELSE
            winner_uuid := highest_bid.bidder_id;
            
            -- Check if reserve is met or buy now was disabled
            IF listing_record.reserve_met OR NOT listing_record.buy_now_enabled THEN
                -- Mark as sold and create transaction
                UPDATE listings 
                SET status = 'sold', updated_at = NOW()
                WHERE id = listing_record.id;
                
                INSERT INTO transactions (listing_id, buyer_id, final_price)
                VALUES (listing_record.id, highest_bid.bidder_id, highest_bid.amount);
                
                -- Create notifications for winner and seller
                PERFORM create_auction_notifications(
                    listing_record.id,
                    'sold',
                    winner_uuid,
                    listing_record.owner_id
                );
            ELSE
                -- Reserve not met, mark as ended
                UPDATE listings 
                SET status = 'ended', updated_at = NOW()
                WHERE id = listing_record.id;
                
                -- Create notification for seller about reserve not met
                PERFORM create_auction_notifications(
                    listing_record.id,
                    'ended',
                    NULL,
                    listing_record.owner_id
                );
            END IF;
        END IF;
        
        finalized_count := finalized_count + 1;
    END LOOP;
    
    RETURN finalized_count;
END;
$$ LANGUAGE plpgsql;
