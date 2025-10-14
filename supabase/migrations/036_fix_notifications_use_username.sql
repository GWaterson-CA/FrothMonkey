-- Migration: Update notifications to use username instead of full_name for anonymity
-- This ensures that user identities remain anonymous in notifications between users

-- Update notify_bid_placed function to use username instead of full_name
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
    
    -- Get bidder name (prioritize username for anonymity)
    SELECT COALESCE(username, 'A bidder') INTO bidder_name
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
    IF FOUND THEN
        SELECT COALESCE(username, 'Another bidder') INTO previous_bidder_name
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

-- Update notify_auction_ended function to use username instead of full_name
CREATE OR REPLACE FUNCTION notify_auction_ended()
RETURNS TRIGGER AS $$
DECLARE
    listing_title TEXT;
    highest_bid RECORD;
    buyer_name TEXT;
    seller_name TEXT;
    had_bids BOOLEAN;
BEGIN
    -- Only process when status changes to 'ended' or 'sold'
    IF NEW.status IN ('ended', 'sold') AND OLD.status != NEW.status THEN
        
        SELECT title INTO listing_title FROM listings WHERE id = NEW.id;
        
        -- Check if there were any bids
        SELECT COUNT(*) > 0 INTO had_bids
        FROM bids WHERE listing_id = NEW.id;
        
        IF had_bids THEN
            -- Get highest bid info (use username for anonymity)
            SELECT b.bidder_id, b.amount, COALESCE(p.username, 'A buyer') as name
            INTO highest_bid
            FROM bids b
            JOIN profiles p ON p.id = b.bidder_id
            WHERE b.listing_id = NEW.id
            ORDER BY b.amount DESC, b.created_at ASC
            LIMIT 1;
            
            buyer_name := highest_bid.name;
            
            -- Get seller name (use username for anonymity)
            SELECT COALESCE(p.username, 'The seller') INTO seller_name
            FROM profiles p WHERE p.id = NEW.owner_id;
            
            -- Notify seller
            PERFORM create_notification(
                NEW.owner_id,
                'listing_ended_seller',
                CASE 
                    WHEN NEW.status = 'sold' THEN 'Your Auction Sold!'
                    ELSE 'Your Auction Ended'
                END,
                CASE 
                    WHEN NEW.status = 'sold' THEN 
                        'Your auction for "' || listing_title || '" sold for $' || highest_bid.amount || ' to ' || buyer_name
                    ELSE 
                        'Your auction for "' || listing_title || '" ended with a high bid of $' || highest_bid.amount
                END,
                NEW.id,
                highest_bid.bidder_id,
                jsonb_build_object(
                    'final_bid', highest_bid.amount,
                    'reserve_met', NEW.reserve_met,
                    'buyer_name', buyer_name,
                    'had_bids', true
                )
            );
            
            -- Notify winner if auction sold
            IF NEW.status = 'sold' THEN
                PERFORM create_notification(
                    highest_bid.bidder_id,
                    'auction_won',
                    'Congratulations! You Won!',
                    'You won the auction for "' || listing_title || '" with a bid of $' || highest_bid.amount,
                    NEW.id,
                    NEW.owner_id,
                    jsonb_build_object(
                        'final_bid', highest_bid.amount,
                        'seller_name', seller_name
                    )
                );
            END IF;
        ELSE
            -- No bids - notify seller
            PERFORM create_notification(
                NEW.owner_id,
                'listing_ended_seller',
                'Your Auction Ended',
                'Your auction for "' || listing_title || '" ended with no bids',
                NEW.id,
                NULL,
                jsonb_build_object(
                    'had_bids', false
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update notify_question_received function if it exists
CREATE OR REPLACE FUNCTION notify_question_received()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    questioner_name TEXT;
BEGIN
    -- Get listing details
    SELECT owner_id, title INTO listing_owner, listing_title
    FROM listings WHERE id = NEW.listing_id;
    
    -- Don't notify if owner is asking themselves a question
    IF NEW.user_id = listing_owner THEN
        RETURN NEW;
    END IF;
    
    -- Get questioner name (use username for anonymity)
    SELECT COALESCE(username, 'Someone') INTO questioner_name
    FROM profiles WHERE id = NEW.user_id;
    
    -- Create notification for listing owner
    PERFORM create_notification(
        listing_owner,
        'question_received',
        'New Question Received',
        questioner_name || ' asked a question about "' || listing_title || '"',
        NEW.listing_id,
        NEW.user_id,
        jsonb_build_object('question_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The triggers already exist from previous migrations, so we don't need to recreate them
-- The function updates will automatically be used by existing triggers

