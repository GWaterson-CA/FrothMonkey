-- Quick check: Were notifications created but webhooks didn't fire?

SELECT '📊 RECENT NOTIFICATIONS (Last 5 minutes)' as check;

-- Check for question_received notifications
SELECT 
    'question_received' as type,
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM notifications
WHERE type = 'question_received'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Check for question_answered notifications  
SELECT 
    'question_answered' as type,
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM notifications
WHERE type = 'question_answered'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Check admin_notification_log
SELECT 
    'admin_notification_log' as source,
    COUNT(*) as count,
    MAX(sent_at) as last_created
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '5 minutes';

SELECT '' as spacing;
SELECT '✅ If counts > 0: Notifications created but webhooks not triggering' as diagnosis;
SELECT '❌ If counts = 0: Database triggers not working' as diagnosis;

