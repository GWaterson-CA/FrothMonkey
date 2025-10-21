-- Simple check: Current state of listing 3ba8cbf9-70ea-4adc-981d-758a8082cd42

-- Current listing info
SELECT 
    'LISTING INFO' as check_type,
    title,
    current_price,
    status,
    CASE 
        WHEN status = 'live' AND NOW() BETWEEN start_time AND end_time THEN 'Active'
        ELSE 'Not Active'
    END as is_active
FROM listings 
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- All bids on this listing
SELECT 
    'BIDS' as check_type,
    au.email as bidder,
    b.amount,
    b.created_at
FROM bids b
JOIN auth.users au ON b.bidder_id = au.id
WHERE b.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY b.amount DESC;

-- All auto-bids configured
SELECT 
    'AUTO-BIDS' as check_type,
    au.email as user_email,
    ab.max_amount,
    ab.enabled
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

