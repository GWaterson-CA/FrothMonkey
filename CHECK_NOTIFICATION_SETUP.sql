-- ===================================================================
-- CHECK NOTIFICATION SETUP
-- ===================================================================
-- Run these queries in Supabase SQL Editor to debug the notification system

-- 1. Check if notifications are being created at all
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
WHERE listing_id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check all bids on this listing
SELECT 
    id,
    bidder_id,
    amount,
    created_at,
    listing_id
FROM bids
WHERE listing_id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1'
ORDER BY created_at DESC;

-- 3. Check the current notify_bid_placed function to see if migration was applied
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'notify_bid_placed';

-- 4. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_bid_placed';

-- 5. Check user notification preferences for the users involved
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.notification_preferences
FROM profiles p
WHERE p.id IN (
    SELECT DISTINCT bidder_id 
    FROM bids 
    WHERE listing_id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1'
);

-- 6. Get listing details
SELECT 
    id,
    title,
    current_price,
    owner_id,
    status
FROM listings
WHERE id = '2fb6feb4-5ae2-4644-89be-fe8493963ca1';

