-- Check what bids actually exist on the listing

SELECT 
    b.amount,
    au.email as bidder_email,
    b.created_at,
    CASE 
        WHEN b.amount = (SELECT MAX(amount) FROM bids WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42')
        THEN '← CURRENT WINNER'
        ELSE ''
    END as status
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC, b.created_at ASC;

-- Also check current price
SELECT 
    current_price,
    status
FROM listings
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

