-- Quick verification script for Q&A Email Notifications deployment
-- Run this after deploying to verify everything is set up correctly

-- ============================================
-- 1. Check notification type constraint
-- ============================================
SELECT 
    '=== NOTIFICATION TYPE CONSTRAINT ===' as section,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- ============================================
-- 2. Check triggers exist
-- ============================================
SELECT 
    '=== TRIGGERS ===' as section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered')
ORDER BY trigger_name;

-- ============================================
-- 3. Check functions exist
-- ============================================
SELECT 
    '=== FUNCTIONS ===' as section,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_name IN ('notify_question_received', 'notify_question_answered')
ORDER BY routine_name;

-- ============================================
-- 4. Check notification preferences default
-- ============================================
SELECT 
    '=== NOTIFICATION PREFERENCES DEFAULT ===' as section,
    column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'notification_preferences';

-- ============================================
-- 5. Sample existing user preferences
-- ============================================
SELECT 
    '=== SAMPLE USER PREFERENCES ===' as section,
    p.username,
    p.notification_preferences->>'email_notifications' as email_enabled,
    p.notification_preferences->>'question_received' as question_received,
    p.notification_preferences->>'question_answered' as question_answered
FROM profiles p
WHERE p.notification_preferences IS NOT NULL
LIMIT 5;

-- ============================================
-- 6. Check recent question-related notifications
-- ============================================
SELECT 
    '=== RECENT QUESTION NOTIFICATIONS ===' as section,
    n.type,
    n.title,
    COUNT(*) as count,
    MAX(n.created_at) as most_recent
FROM notifications n
WHERE n.type IN ('question_received', 'question_answered')
  AND n.created_at > NOW() - INTERVAL '30 days'
GROUP BY n.type, n.title
ORDER BY most_recent DESC;

-- ============================================
-- Summary
-- ============================================
SELECT 
    '=== DEPLOYMENT STATUS ===' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'notifications_type_check' 
              AND pg_get_constraintdef(oid) LIKE '%question_answered%'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as notification_constraint,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_notify_question_answered'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as question_answered_trigger,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'trigger_notify_question_received'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as question_received_trigger,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'notify_question_answered'
        ) THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as notify_function;

