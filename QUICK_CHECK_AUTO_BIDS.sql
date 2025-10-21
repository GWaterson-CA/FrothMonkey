-- Quick script to check auto-bids on any listing
-- Replace 'YOUR_LISTING_ID' with the actual listing ID

-- Shows all auto-bids configured for a listing
SELECT 
    ab.id,
    ab.user_id,
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    ab.created_at,
    ab.updated_at,
    CASE 
        WHEN ab.user_id = (
            SELECT bidder_id FROM bids 
            WHERE listing_id = 'YOUR_LISTING_ID'
            ORDER BY amount DESC, created_at ASC LIMIT 1
        ) THEN '← CURRENT WINNER (will not auto-bid)'
        WHEN ab.max_amount >= next_min_bid('YOUR_LISTING_ID') THEN '← ELIGIBLE TO AUTO-BID'
        ELSE '← Max bid too low'
    END as status
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = 'YOUR_LISTING_ID'
ORDER BY ab.max_amount DESC;

-- Shows current highest bidder
SELECT 
    'Current Winner:' as info,
    b.bidder_id,
    au.email as bidder_email,
    b.amount as current_highest_bid
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = 'YOUR_LISTING_ID'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- Shows what the next minimum bid would be
SELECT 
    'Next Required Bid:' as info,
    next_min_bid('YOUR_LISTING_ID') as next_min_bid;

