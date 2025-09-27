-- Fix the next_min_bid function to allow first bid to equal starting price
-- The issue: Currently the function always adds an increment to the starting price
-- The fix: For first bid (no existing bids), minimum should equal starting price

CREATE OR REPLACE FUNCTION next_min_bid(listing_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    listing_record RECORD;
    bid_count INTEGER;
    calculated_min NUMERIC;
BEGIN
    -- Get listing details
    SELECT current_price, start_price INTO listing_record
    FROM listings WHERE id = listing_id;
    
    -- Check if there are any bids on this listing
    SELECT COUNT(*) INTO bid_count
    FROM bids WHERE bids.listing_id = next_min_bid.listing_id;
    
    -- If no bids exist, minimum bid should be the starting price
    IF bid_count = 0 THEN
        RETURN listing_record.start_price;
    END IF;
    
    -- If bids exist, minimum bid is current price + increment
    calculated_min := GREATEST(listing_record.current_price, listing_record.start_price) + 
                     min_bid_increment(GREATEST(listing_record.current_price, listing_record.start_price));
    
    -- Ensure minimum bid is always at least $1.00
    RETURN GREATEST(calculated_min, 1.00);
END;
$$ LANGUAGE plpgsql;
