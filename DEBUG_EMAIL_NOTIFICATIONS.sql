-- =====================================================
-- DEBUG EMAIL NOTIFICATIONS
-- =====================================================
-- This script helps diagnose why emails aren't being sent
-- =====================================================

-- =====================================================
-- STEP 1: Check if Migration 040 is Applied
-- =====================================================

-- Check if the notify_bid_placed function has been updated with auto-bid logic
SELECT 
    routine_name,
    routine_type,
    last_altered
FROM information_schema.routines 
WHERE routine_name = 'notify_bid_placed'
AND routine_schema = 'public';

-- Check if the function source includes auto-bid checking
-- (This will show if migration 040 has been applied)
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'notify_bid_placed';

-- =====================================================
-- STEP 2: Check User Email Notification Preferences
-- =====================================================

-- Check if chukkey@gmail.com has email notifications enabled
SELECT 
    p.id,
    p.username,
    u.email,
    p.notification_preferences
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'chukkey@gmail.com';

-- If notification_preferences is null or doesn't disable emails, emails should send
-- Look for: {"email": false} which would disable emails

-- =====================================================
-- STEP 3: Check if Notifications Are Being Created
-- =====================================================

-- Check recent notifications for chukkey@gmail.com
SELECT 
    n.created_at,
    n.type,
    n.title,
    n.message,
    n.listing_id,
    l.title as listing_title
FROM notifications n
LEFT JOIN listings l ON l.id = n.listing_id
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
ORDER BY n.created_at DESC
LIMIT 10;

-- Check if any bid_outbid notifications exist at all
SELECT 
    COUNT(*) as total_outbid_notifications,
    MAX(created_at) as most_recent_outbid_notification
FROM notifications 
WHERE type = 'bid_outbid';

-- =====================================================
-- STEP 4: Check Database Webhook Configuration
-- =====================================================

-- Note: Webhooks can't be checked via SQL, you need to:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Database > Webhooks
-- 3. Look for a webhook on the "notifications" table
-- 4. It should trigger on INSERT events
-- 5. It should call the "send-notification-emails" edge function

-- =====================================================
-- STEP 5: Check Recent Bids and Auto-Bids
-- =====================================================

-- Show recent bids to see if notifications should have been triggered
SELECT 
    b.id,
    b.created_at,
    b.amount,
    b.is_auto_bid,
    l.title as listing_title,
    l.current_price,
    p.username as bidder,
    u.email as bidder_email,
    ab.max_amount as bidder_auto_bid_max
FROM bids b
JOIN listings l ON l.id = b.listing_id
JOIN profiles p ON p.id = b.bidder_id
JOIN auth.users u ON u.id = p.id
LEFT JOIN auto_bids ab ON ab.user_id = b.bidder_id AND ab.listing_id = b.listing_id AND ab.enabled = true
WHERE b.created_at > NOW() - INTERVAL '1 hour'
ORDER BY b.created_at DESC
LIMIT 20;

-- =====================================================
-- STEP 6: Manual Test - Find Active Listings
-- =====================================================

-- Find listings you can test with (live listings with bids)
SELECT 
    l.id,
    l.title,
    l.current_price,
    l.status,
    COUNT(b.id) as bid_count,
    MAX(b.amount) as highest_bid,
    (SELECT COUNT(*) FROM auto_bids WHERE listing_id = l.id AND enabled = true) as active_auto_bids
FROM listings l
LEFT JOIN bids b ON b.listing_id = l.id
WHERE l.status = 'live'
AND l.end_time > NOW()
GROUP BY l.id, l.title, l.current_price, l.status
ORDER BY l.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 7: Check Your User ID
-- =====================================================

-- Get your user ID (you'll need this for manual testing)
SELECT 
    p.id as user_id,
    p.username,
    u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'chukkey@gmail.com';

-- =====================================================
-- DIAGNOSTIC SUMMARY
-- =====================================================

SELECT 
    'Check the results above to diagnose the issue:' as step,
    '' as details
UNION ALL
SELECT 
    '1. Migration 040', 
    'Should show notify_bid_placed function with recent last_altered date'
UNION ALL
SELECT 
    '2. User Preferences', 
    'notification_preferences should NOT have {"email": false}'
UNION ALL
SELECT 
    '3. Notifications Created', 
    'Should see bid_outbid notifications in the notifications table'
UNION ALL
SELECT 
    '4. Database Webhook', 
    'Check Supabase Dashboard > Database > Webhooks'
UNION ALL
SELECT 
    '5. Edge Function', 
    'Check Supabase Dashboard > Edge Functions > send-notification-emails';

-- =====================================================
-- NEXT STEPS FOR MANUAL TESTING
-- =====================================================
/*
MANUAL TEST PROCEDURE:

1. First, apply Migration 040 if not already applied:
   - Go to Supabase Dashboard > SQL Editor
   - Run APPLY_AUTO_BID_NOTIFICATION_FIX.sql

2. Find a live listing to test with (or create a new test listing)

3. Set up auto-bid using the frontend UI:
   - Go to the listing page
   - Toggle "Auto Bid" ON
   - Set max bid to $50 (or whatever amount)
   - Click "Set Auto-Bid"

4. From another account, place manual bids:
   - Bid $30 → Should NOT trigger email (auto-bid protects you)
   - Bid $40 → Should NOT trigger email (auto-bid protects you)
   - Bid $60 → SHOULD trigger email (exceeds your $50 limit)

5. Check if notification was created:
   - Run query from STEP 3 above
   - Should see ONE bid_outbid notification after the $60 bid

6. Check if email was sent:
   - Check your email inbox (chukkey@gmail.com)
   - Check spam folder
   - If notification exists but no email, check webhook/edge function

7. Debug webhook if needed:
   - Supabase Dashboard > Database > Webhooks
   - Check webhook logs for errors
   - Verify edge function is deployed and has correct env vars
*/

