-- Check Admin Notifications Deployment Status
-- Run this in your Supabase SQL Editor to see what's deployed

-- =====================================================
-- 1. Check if admin_notification_log table exists
-- =====================================================
SELECT 
    'admin_notification_log table' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'admin_notification_log'
        ) THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND - Need to apply migration'
    END as status;

-- =====================================================
-- 2. Check if trigger functions exist
-- =====================================================
SELECT 
    routine_name as component,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status
FROM information_schema.routines
WHERE routine_name IN ('notify_admin_new_user', 'notify_admin_new_listing');

-- If no results above, functions don't exist:
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Trigger functions NOT FOUND - Need to apply migration'
        ELSE '✅ Found ' || COUNT(*) || ' trigger functions'
    END as trigger_functions_status
FROM information_schema.routines
WHERE routine_name IN ('notify_admin_new_user', 'notify_admin_new_listing');

-- =====================================================
-- 3. Check if triggers exist
-- =====================================================
SELECT 
    trigger_name as component,
    event_object_table as "table",
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing');

-- If no results above, triggers don't exist:
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Triggers NOT FOUND - Need to apply migration'
        ELSE '✅ Found ' || COUNT(*) || ' triggers'
    END as triggers_status
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing');

-- =====================================================
-- 4. Check recent user registrations (last hour)
-- =====================================================
SELECT 
    'Recent user registrations (last 60 minutes)' as info,
    COUNT(*) as count,
    MAX(created_at) as most_recent
FROM profiles
WHERE created_at > NOW() - INTERVAL '60 minutes';

-- Show the recent users
SELECT 
    id,
    username,
    full_name,
    created_at,
    'User registered but notification may not have been sent' as note
FROM profiles
WHERE created_at > NOW() - INTERVAL '60 minutes'
ORDER BY created_at DESC;

-- =====================================================
-- 5. Check if any admin notifications were logged
-- =====================================================
-- This will error if table doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'admin_notification_log'
    ) THEN
        RAISE NOTICE 'Checking admin_notification_log...';
    ELSE
        RAISE NOTICE '❌ admin_notification_log table does not exist';
    END IF;
END $$;

-- If table exists, show recent logs
SELECT 
    notification_type,
    sent_at,
    success,
    error_message,
    metadata
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '60 minutes'
ORDER BY sent_at DESC;

-- If this errors, the table doesn't exist

-- =====================================================
-- DEPLOYMENT STATUS SUMMARY
-- =====================================================

SELECT 
    '📋 DEPLOYMENT STATUS SUMMARY' as heading;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
        THEN '✅ Database migration applied'
        ELSE '❌ Database migration NOT applied - Run: supabase db push or APPLY_ADMIN_NOTIFICATIONS.sql'
    END as migration_status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('notify_admin_new_user', 'notify_admin_new_listing')) = 2
        THEN '✅ Trigger functions exist'
        ELSE '❌ Trigger functions missing - Apply migration'
    END as functions_status;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing')) = 2
        THEN '✅ Database triggers exist'
        ELSE '❌ Database triggers missing - Apply migration'
    END as triggers_status;

-- =====================================================
-- NEXT STEPS
-- =====================================================

SELECT 
    '🚀 TO DEPLOY THE ADMIN NOTIFICATION SYSTEM:' as next_steps;

SELECT 
    '1. Deploy edge function: supabase functions deploy send-admin-notifications --no-verify-jwt' as step_1;

SELECT 
    '2. Set secrets: supabase secrets set RESEND_API_KEY=your_key' as step_2;

SELECT 
    '3. Apply migration: supabase db push (or run APPLY_ADMIN_NOTIFICATIONS.sql)' as step_3;

SELECT 
    '4. Configure webhooks in Supabase Dashboard (see ADMIN_NOTIFICATIONS_GUIDE.md)' as step_4;

SELECT 
    '5. For new user from 30 min ago - you can manually trigger notification (see below)' as step_5;

-- =====================================================
-- MANUAL NOTIFICATION FOR RECENT USER (Optional)
-- =====================================================
-- After deploying, you can manually send notification for the missed user:
/*
-- 1. Find the user ID
SELECT id, username, full_name, created_at 
FROM profiles 
WHERE created_at > NOW() - INTERVAL '60 minutes'
ORDER BY created_at DESC;

-- 2. Manually insert into admin_notification_log (after migration is applied)
-- Replace 'USER_ID_HERE' with the actual user ID from above
INSERT INTO admin_notification_log (notification_type, record_id, metadata)
SELECT 
    'new_user',
    id,
    jsonb_build_object(
        'username', username,
        'full_name', full_name,
        'created_at', created_at
    )
FROM profiles
WHERE created_at > NOW() - INTERVAL '60 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- This will trigger the webhook and send the email
*/

