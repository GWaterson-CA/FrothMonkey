-- Debug script to check why question email wasn't sent
-- For listing: 3ba8cbf9-70ea-4adc-981d-758a8082cd42

-- 1. Check if the question exists
SELECT 
    '=== QUESTION DETAILS ===' as section,
    aq.id,
    aq.question,
    aq.answer,
    aq.created_at,
    aq.answered_at,
    aq.listing_id,
    aq.questioner_id,
    l.title as listing_title,
    l.owner_id as seller_id
FROM auction_questions aq
JOIN listings l ON l.id = aq.listing_id
WHERE aq.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY aq.created_at DESC;

-- 2. Check if notification was created
SELECT 
    '=== NOTIFICATIONS CREATED ===' as section,
    n.id,
    n.type,
    n.title,
    n.message,
    n.user_id,
    n.listing_id,
    n.metadata,
    n.created_at,
    au.email as recipient_email,
    p.username as recipient_username
FROM notifications n
JOIN profiles p ON p.id = n.user_id
JOIN auth.users au ON au.id = n.user_id
WHERE n.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND n.type IN ('question_received', 'question_answered')
ORDER BY n.created_at DESC;

-- 3. Check seller's notification preferences
SELECT 
    '=== SELLER PREFERENCES ===' as section,
    l.owner_id as seller_id,
    p.username as seller_username,
    au.email as seller_email,
    p.notification_preferences->>'email_notifications' as email_enabled,
    p.notification_preferences->>'question_received' as question_received_enabled
FROM listings l
JOIN profiles p ON p.id = l.owner_id
JOIN auth.users au ON au.id = l.owner_id
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- 4. Check if migration was applied
SELECT 
    '=== MIGRATION STATUS ===' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'notifications_type_check' 
              AND pg_get_constraintdef(oid) LIKE '%question_answered%'
        ) THEN '✅ Migration applied'
        ELSE '❌ Migration NOT applied'
    END as migration_status;

-- 5. Check if trigger exists and is enabled
SELECT 
    '=== TRIGGER STATUS ===' as section,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
ORDER BY trigger_name;

-- 6. Check all recent notifications for debugging
SELECT 
    '=== ALL RECENT NOTIFICATIONS ===' as section,
    n.type,
    n.title,
    COUNT(*) as count,
    MAX(n.created_at) as most_recent
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '1 hour'
GROUP BY n.type, n.title
ORDER BY most_recent DESC;

