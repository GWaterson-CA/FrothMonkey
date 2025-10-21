-- Simple check: Show all auto-bids on listing 3ba8cbf9-70ea-4adc-981d-758a8082cd42

-- Who has auto-bids set up?
SELECT 
    au.email as user_email,
    ab.max_amount,
    ab.enabled,
    ab.created_at
FROM auto_bids ab
JOIN auth.users au ON ab.user_id = au.id
WHERE ab.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY ab.max_amount DESC;

-- If this returns NO ROWS, then the auto-bids were never saved to the database

