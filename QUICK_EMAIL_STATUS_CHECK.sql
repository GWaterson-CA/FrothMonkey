-- =====================================================
-- QUICK EMAIL AUTOMATION STATUS CHECK
-- =====================================================
-- This shows everything in ONE simple result table
-- =====================================================

SELECT 
    'DEPLOYMENT STATUS' as category,
    'Q&A Email Notifications' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
        ) THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need migration 041'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
        ) THEN 'Ready for webhooks'
        ELSE 'Run: APPLY_Q&A_EMAIL_MIGRATION.sql'
    END as action_needed

UNION ALL

SELECT 
    'DEPLOYMENT STATUS' as category,
    'Admin Notifications' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
        AND EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing')
        ) THEN '✅ DEPLOYED'
        ELSE '❌ NOT DEPLOYED - Need migration 044'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log')
        AND EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_notify_admin_new_user', 'trigger_notify_admin_new_listing')
        ) THEN 'Ready for webhooks'
        ELSE 'Run: APPLY_ADMIN_NOTIFICATIONS.sql'
    END as action_needed

UNION ALL

SELECT 
    'RECENT ACTIVITY' as category,
    'New Users (Last 24h)' as component,
    COUNT(*)::text as status,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Users registered - should have triggered emails'
        ELSE 'No new users in last 24 hours'
    END as action_needed
FROM profiles
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'RECENT ACTIVITY' as category,
    'Questions on Test Listing' as component,
    COUNT(*)::text as status,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Questions exist on test listing'
        ELSE 'No questions on test listing yet'
    END as action_needed
FROM auction_questions
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'

UNION ALL

SELECT 
    'WEBHOOKS NEEDED' as category,
    'Send Notification Emails' as component,
    'Webhook for notifications table' as status,
    'Configure in: Database → Webhooks' as action_needed

UNION ALL

SELECT 
    'WEBHOOKS NEEDED' as category,
    'Admin - New User' as component,
    'Webhook for admin_notification_log (new_user)' as status,
    'Configure in: Database → Webhooks' as action_needed

UNION ALL

SELECT 
    'WEBHOOKS NEEDED' as category,
    'Admin - New Listing' as component,
    'Webhook for admin_notification_log (new_listing)' as status,
    'Configure in: Database → Webhooks' as action_needed

ORDER BY category, component;

