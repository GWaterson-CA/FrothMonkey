-- Diagnostic query to check why email wasn't sent for listing 7873d469-d927-49c6-82e9-09d9e13d65eb
-- This checks the entire notification flow

-- 1. Check listing details and status
SELECT 
    '📋 LISTING DETAILS' as section,
    id,
    title,
    status,
    owner_id,
    current_price,
    reserve_met,
    end_time,
    start_time,
    NOW() as current_time,
    CASE 
        WHEN end_time < NOW() THEN '✅ Ended (past end_time)'
        ELSE '⏳ Still active'
    END as end_status_check
FROM listings
WHERE id = '7873d469-d927-49c6-82e9-09d9e13d65eb';

-- 2. Check if there were any bids
SELECT 
    '💰 BID INFORMATION' as section,
    COUNT(*) as total_bids,
    COUNT(DISTINCT bidder_id) as unique_bidders,
    MAX(amount) as highest_bid,
    MAX(created_at) as last_bid_time
FROM bids
WHERE listing_id = '7873d469-d927-49c6-82e9-09d9e13d65eb';

-- 3. Check if notifications were created
SELECT 
    '🔔 NOTIFICATIONS CREATED' as section,
    id,
    user_id,
    type,
    title,
    message,
    created_at,
    read_at,
    metadata
FROM notifications
WHERE listing_id = '7873d469-d927-49c6-82e9-09d9e13d65eb'
ORDER BY created_at DESC;

-- 4. Check if trigger exists
SELECT 
    '⚙️ TRIGGER STATUS' as section,
    tgname as trigger_name,
    tgtype::text as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'listings'::regclass
    AND tgname LIKE '%notify%auction%ended%'
    OR tgname LIKE '%notify%listing%ended%';

-- 5. Check owner profile and email preferences
SELECT 
    '👤 OWNER PROFILE' as section,
    p.id,
    p.username,
    p.full_name,
    p.notification_preferences,
    COALESCE(p.notification_preferences->>'email_notifications', 'true') as email_notifications_enabled,
    COALESCE(p.notification_preferences->>'listing_ended', 'true') as listing_ended_enabled,
    au.email as owner_email
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
JOIN listings l ON l.owner_id = p.id
WHERE l.id = '7873d469-d927-49c6-82e9-09d9e13d65eb';

-- 6. Check if webhook is configured (this requires manual check in Supabase Dashboard)
-- But we can check if edge function exists
SELECT 
    '🌐 EDGE FUNCTION CHECK' as section,
    'Manual check required: Go to Supabase Dashboard > Database > Webhooks' as webhook_check,
    'Look for webhook on "notifications" table with INSERT event' as webhook_details,
    'Edge function should be: send-notification-emails' as edge_function_name;

-- 7. Check when status last changed (if audit/history table exists)
-- This might not exist, but let's try
SELECT 
    '📜 STATUS CHANGE HISTORY' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'listings_history' 
            OR table_name = 'listings_audit'
        ) THEN 'History table exists - check manually'
        ELSE 'No history table found - status change not tracked'
    END as history_status;

-- 8. Check highest bidder info (if bids exist)
SELECT 
    '🏆 HIGHEST BIDDER INFO' as section,
    b.bidder_id,
    b.amount as bid_amount,
    b.created_at as bid_time,
    p.username as bidder_username,
    p.full_name as bidder_name,
    au.email as bidder_email,
    COALESCE(p.notification_preferences->>'email_notifications', 'true') as email_notifications_enabled
FROM bids b
JOIN profiles p ON p.id = b.bidder_id
LEFT JOIN auth.users au ON au.id = b.bidder_id
WHERE b.listing_id = '7873d469-d927-49c6-82e9-09d9e13d65eb'
ORDER BY b.amount DESC, b.created_at ASC
LIMIT 1;

-- 9. Summary diagnosis
SELECT 
    '🔍 DIAGNOSIS SUMMARY' as section,
    l.status as listing_status,
    l.end_time < NOW() as has_ended_by_time,
    COUNT(b.id) > 0 as has_bids,
    COUNT(n.id) FILTER (WHERE n.type = 'listing_ended_seller') as seller_notifications_count,
    COUNT(n.id) FILTER (WHERE n.type = 'auction_won') as buyer_notifications_count,
    CASE 
        WHEN l.status NOT IN ('ended', 'sold') THEN '❌ ISSUE: Listing status is not "ended" or "sold" - trigger will not fire!'
        WHEN COUNT(n.id) FILTER (WHERE n.type = 'listing_ended_seller') = 0 THEN '❌ ISSUE: No seller notification created - trigger may not have fired'
        WHEN COUNT(n.id) FILTER (WHERE n.type = 'listing_ended_seller') > 0 THEN '⚠️ NOTIFICATION CREATED: Check webhook/edge function logs'
        ELSE '❓ UNKNOWN ISSUE'
    END as diagnosis
FROM listings l
LEFT JOIN bids b ON b.listing_id = l.id
LEFT JOIN notifications n ON n.listing_id = l.id
WHERE l.id = '7873d469-d927-49c6-82e9-09d9e13d65eb'
GROUP BY l.id, l.status, l.end_time;

