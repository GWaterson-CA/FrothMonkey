-- Fix data integrity issue where current_price is less than start_price
-- This can happen when previous migrations updated prices incorrectly

-- Update listings where current_price is less than start_price
-- Set current_price to match start_price for listings with no bids
UPDATE listings 
SET current_price = start_price,
    updated_at = NOW()
WHERE current_price < start_price
  AND id NOT IN (
    SELECT DISTINCT listing_id 
    FROM bids 
    WHERE listing_id = listings.id
  );

-- For listings with bids but invalid current_price, set to highest bid
UPDATE listings 
SET current_price = (
    SELECT MAX(amount) 
    FROM bids 
    WHERE listing_id = listings.id
),
updated_at = NOW()
WHERE current_price < start_price
  AND id IN (
    SELECT DISTINCT listing_id 
    FROM bids 
    WHERE listing_id = listings.id
  );

-- Add a check constraint to prevent this issue in the future
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'listings_current_price_gte_start_price'
    ) THEN
        ALTER TABLE listings ADD CONSTRAINT listings_current_price_gte_start_price
        CHECK (current_price >= start_price);
    END IF;
END $$;
