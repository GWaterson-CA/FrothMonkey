-- Check and create contact exchange for test listing a5b13998-4f3d-46c6-a5a4-8c014df6297f
--
-- ⚠️ IMPORTANT: Before running this script, you MUST:
-- 1. Apply migration 026_auction_contact_exchange.sql first
-- 2. Run FIX_CONTACT_EXCHANGE_NOTIFICATION_TYPES.sql to add notification types to constraint
--

-- First, check the listing status and details
SELECT 
  id,
  title,
  status,
  owner_id as seller_id,
  current_price,
  reserve_met,
  end_time,
  NOW() as current_time,
  CASE WHEN NOW() >= end_time THEN 'ENDED' ELSE 'LIVE' END as time_status
FROM listings
WHERE id = 'a5b13998-4f3d-46c6-a5a4-8c014df6297f';

-- Check if a contact exchange already exists
SELECT 
  ac.*,
  l.title as listing_title,
  l.status as listing_status,
  seller.username as seller_username,
  buyer.username as buyer_username
FROM auction_contacts ac
JOIN listings l ON l.id = ac.listing_id
LEFT JOIN profiles seller ON seller.id = ac.seller_id
LEFT JOIN profiles buyer ON buyer.id = ac.buyer_id
WHERE ac.listing_id = 'a5b13998-4f3d-46c6-a5a4-8c014df6297f';

-- Check highest bid for this listing
SELECT 
  b.id,
  b.bidder_id,
  b.amount,
  p.username,
  p.full_name
FROM bids b
LEFT JOIN profiles p ON p.id = b.bidder_id
WHERE b.listing_id = 'a5b13998-4f3d-46c6-a5a4-8c014df6297f'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- If listing has ended and has bids, create contact exchange manually if needed
-- (This is for testing purposes - normally finalize_auctions() creates these)
DO $$
DECLARE
  v_listing_id UUID := 'a5b13998-4f3d-46c6-a5a4-8c014df6297f';
  v_listing_record RECORD;
  v_highest_bid RECORD;
  v_contact_exists BOOLEAN;
  v_contact_id UUID;
BEGIN
  -- Get listing details
  SELECT * INTO v_listing_record
  FROM listings
  WHERE id = v_listing_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Listing not found';
    RETURN;
  END IF;
  
  -- Check if contact exchange already exists
  SELECT EXISTS(
    SELECT 1 FROM auction_contacts WHERE listing_id = v_listing_id
  ) INTO v_contact_exists;
  
  IF v_contact_exists THEN
    RAISE NOTICE 'Contact exchange already exists for this listing';
    RETURN;
  END IF;
  
  -- Get highest bid
  SELECT bidder_id, amount INTO v_highest_bid
  FROM bids
  WHERE listing_id = v_listing_id
  ORDER BY amount DESC, created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No bids found for this listing';
    RETURN;
  END IF;
  
  -- Check if listing has ended
  IF v_listing_record.status NOT IN ('ended', 'sold') AND NOW() < v_listing_record.end_time THEN
    RAISE NOTICE 'Listing has not ended yet';
    RETURN;
  END IF;
  
  -- Create contact exchange using the function
  SELECT create_contact_exchange(
    v_listing_id,
    v_listing_record.owner_id,
    v_highest_bid.bidder_id,
    v_highest_bid.amount,
    v_listing_record.reserve_met
  ) INTO v_contact_id;
  
  RAISE NOTICE 'Contact exchange created with ID: %', v_contact_id;
  
END $$;

-- Show the created contact exchange (moved outside DO block)
SELECT 
  ac.*,
  l.title as listing_title,
  l.status as listing_status,
  seller.username as seller_username,
  buyer.username as buyer_username
FROM auction_contacts ac
JOIN listings l ON l.id = ac.listing_id
LEFT JOIN profiles seller ON seller.id = ac.seller_id
LEFT JOIN profiles buyer ON buyer.id = ac.buyer_id
WHERE ac.listing_id = 'a5b13998-4f3d-46c6-a5a4-8c014df6297f';

