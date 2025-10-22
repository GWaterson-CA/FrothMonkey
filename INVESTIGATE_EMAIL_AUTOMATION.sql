-- =====================================================
-- EMAIL AUTOMATION INVESTIGATION SCRIPT
-- =====================================================
-- This script checks the deployment status of:
-- 1. Q&A Email Notifications (question received & answered)
-- 2. Admin Notifications (new user registration)
-- 3. Recent activity that should have triggered emails
-- =====================================================

SELECT '=====================================================' as separator;
SELECT '🔍 PART 1: Q&A EMAIL NOTIFICATIONS STATUS' as section_header;
SELECT '=====================================================' as separator;

-- Check if question notification triggers exist
SELECT 
    '1. Question Notification Triggers' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need to apply migration 041'
    END as status,
    STRING_AGG(trigger_name, ', ') as found_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered');

-- Check if question notification functions exist
SELECT 
    '2. Question Notification Functions' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need to apply migration 041'
    END as status,
    STRING_AGG(routine_name, ', ') as found_functions
FROM information_schema.routines
WHERE routine_name IN ('notify_question_received', 'notify_question_answered');

-- Check if question_answered is in notification types
SELECT 
    '3. Notification Type Constraint' as check_name,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%question_answered%' THEN '✅ INCLUDES question_answered'
        ELSE '❌ MISSING question_answered - Need to apply migration 041'
    END as status
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔍 PART 2: ADMIN NOTIFICATIONS STATUS' as section_header;
SELECT '=====================================================' as separator;

-- Check if admin notification table exists
SELECT 
    '4. Admin Notification Table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
        THEN '✅ TABLE EXISTS'
        ELSE '❌ TABLE MISSING - Need to apply migration 044'
    END as status;

-- Check if admin notification triggers exist
SELECT 
    '5. Admin Notification Triggers' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need to apply migration 044'
    END as status,
    STRING_AGG(trigger_name, ', ') as found_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing');

-- Check if admin notification functions exist
SELECT 
    '6. Admin Notification Functions' as check_name,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need to apply migration 044'
    END as status,
    STRING_AGG(routine_name, ', ') as found_functions
FROM information_schema.routines
WHERE routine_name IN ('notify_admin_new_user', 'notify_admin_new_listing');

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '📊 PART 3: RECENT ACTIVITY ANALYSIS' as section_header;
SELECT '=====================================================' as separator;

-- Check recent user registrations (last 24 hours)
SELECT 
    '7. New User Registrations (Last 24h)' as check_name,
    COUNT(*) as count,
    MAX(created_at) as most_recent_registration
FROM profiles
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Show recent users
SELECT 
    'Recent Users:' as info,
    username,
    full_name,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN '⚠️ Should have received admin notification'
        ELSE '✓ Older registration'
    END as notification_status
FROM profiles
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check recent questions on the test listing
SELECT 
    '8. Questions on Test Listing' as check_name,
    COUNT(*) as total_questions,
    SUM(CASE WHEN answer IS NOT NULL THEN 1 ELSE 0 END) as answered_questions,
    SUM(CASE WHEN answer IS NULL THEN 1 ELSE 0 END) as unanswered_questions
FROM auction_questions
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Show all questions on test listing with details
SELECT 
    'Test Listing Questions:' as info,
    q.id,
    q.question,
    q.answer,
    q.created_at as asked_at,
    COALESCE(p_questioner.username, 'Unknown') as asked_by,
    CASE 
        WHEN q.answer IS NOT NULL THEN '✅ Answered'
        ELSE '❌ Not answered yet'
    END as status
FROM auction_questions q
LEFT JOIN profiles p_questioner ON q.questioner_id = p_questioner.id
WHERE q.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY q.created_at DESC;

-- Check if notifications were created for these questions
SELECT 
    '9. Question Notifications Created' as check_name,
    COUNT(*) as notification_count,
    STRING_AGG(DISTINCT n.type, ', ') as notification_types
FROM notifications n
WHERE n.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND n.type IN ('question_received', 'question_answered');

-- Show recent question notifications
SELECT 
    'Recent Question Notifications:' as info,
    n.type,
    n.title,
    n.message,
    n.created_at,
    COALESCE(p.username, 'Unknown') as recipient
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND n.type IN ('question_received', 'question_answered')
ORDER BY n.created_at DESC;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🗄️ PART 4: ADMIN NOTIFICATION LOG CHECK' as section_header;
SELECT '=====================================================' as separator;

-- Check if any admin notifications were logged
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log') THEN
        RAISE NOTICE 'admin_notification_log table exists, checking records...';
    ELSE
        RAISE NOTICE '❌ admin_notification_log table does NOT exist - migration 044 not applied';
    END IF;
END $$;

-- Show recent admin notification log entries (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log') THEN
        -- Table exists, show the query result
        RAISE NOTICE 'Querying admin_notification_log table...';
    ELSE
        RAISE NOTICE '⚠️ admin_notification_log table does not exist - migration 044 not applied';
        RAISE NOTICE '   Run: npx supabase db push OR apply APPLY_ADMIN_NOTIFICATIONS.sql';
    END IF;
END $$;

-- Only query if table exists
SELECT 
    '10. Admin Notification Log' as check_name,
    COUNT(*) as total_logged,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log');

-- Show recent admin notification details (only if table exists)
SELECT 
    'Recent Admin Notifications:' as info,
    notification_type,
    sent_at,
    success,
    error_message,
    metadata->>'username' as username,
    metadata->>'full_name' as full_name
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '24 hours'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
ORDER BY sent_at DESC;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '📋 DEPLOYMENT STATUS SUMMARY' as section_header;
SELECT '=====================================================' as separator;

-- Overall deployment summary
SELECT 
    'Q&A Email Notifications (Migration 041)' as feature,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
            HAVING COUNT(*) = 2
        ) THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED'
    END as status
UNION ALL
SELECT 
    'Admin Notifications (Migration 044)' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
        AND EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing')
            HAVING COUNT(*) = 2
        ) THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED'
    END as status;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔧 WEBHOOKS CHECK (Manual verification needed)' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    'IMPORTANT: Check Webhooks in Supabase Dashboard' as note,
    'Go to: Database → Webhooks' as action;

SELECT 
    'Required Webhook 1:' as webhook,
    'Send Notification Emails' as name,
    'notifications table, INSERT event' as config,
    'send-notification-emails edge function' as target,
    'Triggers emails for Q&A notifications' as purpose;

SELECT 
    'Required Webhook 2:' as webhook,
    'Admin Notification - New User' as name,
    'admin_notification_log table, INSERT, notification_type = new_user' as config,
    'send-admin-notifications edge function' as target,
    'Triggers emails for new user registrations' as purpose;

SELECT 
    'Required Webhook 3:' as webhook,
    'Admin Notification - New Listing' as name,
    'admin_notification_log table, INSERT, notification_type = new_listing' as config,
    'send-admin-notifications edge function' as target,
    'Triggers emails for new listings' as purpose;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🚀 NEXT STEPS BASED ON RESULTS' as section_header;
SELECT '=====================================================' as separator;

-- Conditional recommendations
DO $$
DECLARE
    qa_deployed BOOLEAN;
    admin_deployed BOOLEAN;
BEGIN
    -- Check Q&A deployment
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_notify_question_answered'
    ) INTO qa_deployed;
    
    -- Check Admin deployment
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'admin_notification_log'
    ) INTO admin_deployed;
    
    RAISE NOTICE '===================================================';
    
    IF NOT qa_deployed THEN
        RAISE NOTICE '❌ Q&A Email Notifications NOT DEPLOYED';
        RAISE NOTICE '   → Apply migration 041: supabase db push';
        RAISE NOTICE '   → OR run: APPLY_Q&A_EMAIL_MIGRATION.sql';
    ELSE
        RAISE NOTICE '✅ Q&A Email Notifications ARE DEPLOYED';
        RAISE NOTICE '   → Check if webhook is configured';
        RAISE NOTICE '   → Check edge function is deployed';
    END IF;
    
    RAISE NOTICE '';
    
    IF NOT admin_deployed THEN
        RAISE NOTICE '❌ Admin Notifications NOT DEPLOYED';
        RAISE NOTICE '   → Apply migration 044: supabase db push';
        RAISE NOTICE '   → OR run: APPLY_ADMIN_NOTIFICATIONS.sql';
    ELSE
        RAISE NOTICE '✅ Admin Notifications ARE DEPLOYED';
        RAISE NOTICE '   → Check if webhooks are configured';
        RAISE NOTICE '   → Check edge function is deployed';
        RAISE NOTICE '   → Admin email is now: frothmonkeyca@gmail.com';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '===================================================';
END $$;

