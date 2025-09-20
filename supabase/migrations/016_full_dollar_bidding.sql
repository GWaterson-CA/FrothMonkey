-- Update minimum bid increment function to ensure full dollar increments
CREATE OR REPLACE FUNCTION min_bid_increment(amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    -- Always return at least $1 increment for full dollar bidding
    CASE 
        WHEN amount < 100 THEN RETURN 1;
        WHEN amount < 1000 THEN RETURN 5;
        ELSE RETURN 10;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update next minimum bid function to ensure minimum of $1
CREATE OR REPLACE FUNCTION next_min_bid(listing_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    listing_record RECORD;
    calculated_min NUMERIC;
BEGIN
    SELECT current_price, start_price INTO listing_record
    FROM listings WHERE id = listing_id;
    
    calculated_min := GREATEST(listing_record.current_price, listing_record.start_price) + 
                     min_bid_increment(GREATEST(listing_record.current_price, listing_record.start_price));
    
    -- Ensure minimum bid is always at least $1.00
    RETURN GREATEST(calculated_min, 1.00);
END;
$$ LANGUAGE plpgsql;

-- First, update existing data to meet the new whole dollar requirements
-- Update bids: round up amounts less than $1 to $1, and round other amounts to nearest dollar
UPDATE bids 
SET amount = CASE 
    WHEN amount < 1 THEN 1
    ELSE ROUND(amount, 0)
END
WHERE amount != ROUND(amount, 0) OR amount < 1;

-- Update listings: round up prices less than $1 to $1, and round other prices to nearest dollar
UPDATE listings 
SET start_price = CASE 
    WHEN start_price < 1 THEN 1
    ELSE ROUND(start_price, 0)
END,
current_price = CASE 
    WHEN current_price < 1 THEN 1
    ELSE ROUND(current_price, 0)
END,
reserve_price = CASE 
    WHEN reserve_price IS NOT NULL AND reserve_price < 1 THEN 1
    WHEN reserve_price IS NOT NULL THEN ROUND(reserve_price, 0)
    ELSE reserve_price
END,
buy_now_price = CASE 
    WHEN buy_now_price IS NOT NULL AND buy_now_price < 1 THEN 1
    WHEN buy_now_price IS NOT NULL THEN ROUND(buy_now_price, 0)
    ELSE buy_now_price
END
WHERE start_price != ROUND(start_price, 0) OR start_price < 1
   OR current_price != ROUND(current_price, 0) OR current_price < 1
   OR (reserve_price IS NOT NULL AND (reserve_price != ROUND(reserve_price, 0) OR reserve_price < 1))
   OR (buy_now_price IS NOT NULL AND (buy_now_price != ROUND(buy_now_price, 0) OR buy_now_price < 1));

-- Now add constraints to ensure all future bid amounts are whole dollars
-- First check if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bids_amount_whole_dollars'
    ) THEN
        ALTER TABLE bids ADD CONSTRAINT bids_amount_whole_dollars 
        CHECK (amount = floor(amount) AND amount >= 1);
    END IF;
END $$;

-- Add constraint to ensure all listing prices are whole dollars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'listings_start_price_whole_dollars'
    ) THEN
        ALTER TABLE listings ADD CONSTRAINT listings_start_price_whole_dollars 
        CHECK (start_price = floor(start_price) AND start_price >= 1);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'listings_current_price_whole_dollars'
    ) THEN
        ALTER TABLE listings ADD CONSTRAINT listings_current_price_whole_dollars 
        CHECK (current_price = floor(current_price) AND current_price >= 1);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'listings_reserve_price_whole_dollars'
    ) THEN
        ALTER TABLE listings ADD CONSTRAINT listings_reserve_price_whole_dollars 
        CHECK (reserve_price IS NULL OR (reserve_price = floor(reserve_price) AND reserve_price >= 1));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'listings_buy_now_price_whole_dollars'
    ) THEN
        ALTER TABLE listings ADD CONSTRAINT listings_buy_now_price_whole_dollars 
        CHECK (buy_now_price IS NULL OR (buy_now_price = floor(buy_now_price) AND buy_now_price >= 1));
    END IF;
END $$;
