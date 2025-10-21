-- Test Admin Notifications System
-- Run these queries to test the admin notification system

-- =====================================================
-- Test 1: Check if admin_notification_log table exists
-- =====================================================
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'admin_notification_log'
    ) as table_exists;

-- =====================================================
-- Test 2: Check if triggers exist
-- =====================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing');

-- =====================================================
-- Test 3: Manually insert a test notification for new user
-- =====================================================
-- This simulates what happens when a new user registers
-- Check frothmonkey@myyahoo.com for the email

INSERT INTO admin_notification_log (notification_type, record_id, metadata)
VALUES (
    'new_user', 
    gen_random_uuid(), 
    jsonb_build_object(
        'username', 'test_user_' || floor(random() * 1000)::text,
        'full_name', 'Test User',
        'created_at', NOW()
    )
);

-- Wait a few seconds, then check if the notification was logged
SELECT * FROM admin_notification_log 
WHERE notification_type = 'new_user' 
ORDER BY sent_at DESC 
LIMIT 1;

-- =====================================================
-- Test 4: Manually insert a test notification for new listing
-- =====================================================
-- This simulates what happens when a new listing is created
-- Check frothmonkey@myyahoo.com for the email

INSERT INTO admin_notification_log (notification_type, record_id, metadata)
VALUES (
    'new_listing', 
    gen_random_uuid(), 
    jsonb_build_object(
        'title', 'Test Listing - ' || NOW()::text,
        'description', 'This is a test listing to verify admin notifications are working correctly.',
        'owner_id', (SELECT id FROM profiles LIMIT 1), -- Uses first available user
        'start_price', 100.00,
        'reserve_price', 150.00,
        'buy_now_price', 200.00,
        'cover_image_url', NULL,
        'status', 'draft',
        'created_at', NOW()
    )
);

-- Wait a few seconds, then check if the notification was logged
SELECT * FROM admin_notification_log 
WHERE notification_type = 'new_listing' 
ORDER BY sent_at DESC 
LIMIT 1;

-- =====================================================
-- Test 5: View all admin notifications (last 10)
-- =====================================================
SELECT 
    notification_type,
    sent_at,
    success,
    error_message,
    metadata->>'username' as username,
    metadata->>'title' as listing_title,
    metadata
FROM admin_notification_log
ORDER BY sent_at DESC
LIMIT 10;

-- =====================================================
-- Test 6: Count notifications by type
-- =====================================================
SELECT 
    notification_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE success = true) as successful,
    COUNT(*) FILTER (WHERE success = false) as failed
FROM admin_notification_log
GROUP BY notification_type
ORDER BY notification_type;

-- =====================================================
-- Test 7: Check for failed notifications
-- =====================================================
SELECT 
    notification_type,
    sent_at,
    error_message,
    metadata
FROM admin_notification_log
WHERE success = false
ORDER BY sent_at DESC
LIMIT 10;

-- =====================================================
-- Test 8: Test the trigger by creating a real test listing
-- =====================================================
-- This will actually create a listing and trigger the notification
-- Make sure you have at least one user and one category

-- First, check if we have users and categories
SELECT 'Users count:', COUNT(*) FROM profiles;
SELECT 'Categories count:', COUNT(*) FROM categories;

-- If you have users and categories, uncomment and run this:
/*
INSERT INTO listings (
    owner_id,
    category_id,
    title,
    description,
    condition,
    start_price,
    reserve_price,
    buy_now_price,
    start_time,
    end_time,
    status
)
VALUES (
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM categories LIMIT 1),
    'Test Listing for Admin Notification - ' || NOW()::text,
    'This is a test listing to verify the admin notification system is working.',
    'good',
    50.00,
    75.00,
    100.00,
    NOW(),
    NOW() + INTERVAL '7 days',
    'draft'
);
*/

-- Check if the trigger fired and logged the notification
SELECT * FROM admin_notification_log 
WHERE notification_type = 'new_listing' 
ORDER BY sent_at DESC 
LIMIT 1;

-- =====================================================
-- Test 9: Clean up test notifications (optional)
-- =====================================================
-- Uncomment to delete test notifications
/*
DELETE FROM admin_notification_log
WHERE metadata->>'username' LIKE 'test_user_%'
   OR metadata->>'title' LIKE 'Test Listing%';
*/

-- =====================================================
-- Test 10: Check webhook configuration (must be done in Supabase Dashboard)
-- =====================================================
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/webhooks
-- Verify that these two webhooks exist:
-- 1. Admin Notification - New User (triggers on admin_notification_log INSERT where notification_type = 'new_user')
-- 2. Admin Notification - New Listing (triggers on admin_notification_log INSERT where notification_type = 'new_listing')

-- =====================================================
-- TROUBLESHOOTING QUERIES
-- =====================================================

-- Check if edge function exists (requires Supabase CLI or dashboard access)
-- supabase functions list

-- View edge function logs (requires Supabase CLI)
-- supabase functions logs send-admin-notifications

-- Check Resend API key is set (requires Supabase CLI)
-- supabase secrets list

-- Manual cleanup of old logs (older than 90 days)
-- DELETE FROM admin_notification_log WHERE sent_at < NOW() - INTERVAL '90 days';

