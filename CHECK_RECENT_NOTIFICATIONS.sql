-- Check the most recent notifications created
-- Run this in Supabase SQL Editor to see if notifications are being created

SELECT 
    id,
    user_id,
    type,
    title,
    message,
    listing_id,
    metadata,
    created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for bid_outbid notifications on the Candleholder listing
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    metadata,
    created_at
FROM notifications
WHERE listing_id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1'
    AND type = 'bid_outbid'
ORDER BY created_at DESC
LIMIT 5;

