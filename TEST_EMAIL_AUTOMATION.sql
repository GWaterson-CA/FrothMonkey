-- =====================================================
-- EMAIL AUTOMATION TESTING SCRIPT
-- =====================================================
-- This script tests email notifications using the test listing
-- Listing ID: 3ba8cbf9-70ea-4adc-981d-758a8082cd42
-- 
-- IMPORTANT: This will create TEST data but won't be visible
-- on the website (we'll clean it up after testing)
-- =====================================================

SELECT '=====================================================' as separator;
SELECT '🧪 EMAIL AUTOMATION TESTING' as section_header;
SELECT '=====================================================' as separator;
SELECT 'Test Listing ID: 3ba8cbf9-70ea-4adc-981d-758a8082cd42' as info;
SELECT '' as spacing;

-- Get test listing details
SELECT 
    '📦 Test Listing Details' as info,
    l.title,
    l.owner_id,
    COALESCE(p.username, 'Unknown') as owner_username,
    COALESCE(p.full_name, 'Unknown') as owner_name,
    l.status
FROM listings l
LEFT JOIN profiles p ON l.owner_id = p.id
WHERE l.id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '📝 TEST 1: Question Received Email' as section_header;
SELECT '=====================================================' as separator;

-- Get current user (must be logged in to run this)
SELECT 'Creating a test question...' as status;

-- Insert a test question (you need to replace USER_ID with your actual user ID)
-- This will trigger the question_received notification to the seller

INSERT INTO auction_questions (
    listing_id,
    questioner_id,
    question
)
SELECT 
    '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
    id,
    'TEST QUESTION: Does this item come with original packaging? (This is a test question for email automation)'
FROM profiles
WHERE username = (SELECT current_user)
LIMIT 1
RETURNING 
    id as question_id,
    '✅ Test question created' as status,
    'Check if notification was created in notifications table' as next_step;

-- Wait a moment for trigger to fire
SELECT pg_sleep(2);

-- Check if notification was created
SELECT 
    '🔔 Notification Created?' as check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Notification created'
        ELSE '❌ NO - Trigger may not be working'
    END as status,
    COUNT(*) as notification_count
FROM notifications
WHERE type = 'question_received'
  AND listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '1 minute';

-- Show the created notification
SELECT 
    'Notification Details:' as info,
    n.id,
    n.type,
    n.title,
    n.message,
    n.created_at,
    n.metadata,
    COALESCE(p.username, 'Unknown') as recipient_username
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.type = 'question_received'
  AND n.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND n.created_at > NOW() - INTERVAL '1 minute';

SELECT '' as spacing;
SELECT '⚠️ IMPORTANT: Check Resend Dashboard' as note;
SELECT '   → Go to https://resend.com/emails' as instruction;
SELECT '   → Look for emails sent in the last minute' as instruction;
SELECT '   → If no email, webhook may not be configured' as instruction;
SELECT '' as spacing;

SELECT '=====================================================' as separator;
SELECT '📝 TEST 2: Question Answered Email' as section_header;
SELECT '=====================================================' as separator;

-- Get the most recent unanswered test question
SELECT 'Answering the test question...' as status;

-- Update the question with an answer (triggers question_answered notification)
UPDATE auction_questions
SET answer = 'TEST ANSWER: Yes, it includes the original packaging and all accessories. (This is a test answer for email automation)'
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND answer IS NULL
  AND question LIKE '%TEST QUESTION%'
ORDER BY created_at DESC
LIMIT 1
RETURNING 
    id as question_id,
    '✅ Test answer added' as status,
    'Check if notification was created for the questioner' as next_step;

-- Wait a moment for trigger to fire
SELECT pg_sleep(2);

-- Check if notification was created
SELECT 
    '🔔 Notification Created?' as check,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Notification created'
        ELSE '❌ NO - Trigger may not be working'
    END as status,
    COUNT(*) as notification_count
FROM notifications
WHERE type = 'question_answered'
  AND listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '1 minute';

-- Show the created notification
SELECT 
    'Notification Details:' as info,
    n.id,
    n.type,
    n.title,
    n.message,
    n.created_at,
    n.metadata,
    COALESCE(p.username, 'Unknown') as recipient_username
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.type = 'question_answered'
  AND n.listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND n.created_at > NOW() - INTERVAL '1 minute';

SELECT '' as spacing;
SELECT '⚠️ IMPORTANT: Check Resend Dashboard' as note;
SELECT '   → Go to https://resend.com/emails' as instruction;
SELECT '   → Look for emails sent in the last minute' as instruction;
SELECT '   → If no email, webhook may not be configured' as instruction;
SELECT '' as spacing;

SELECT '=====================================================' as separator;
SELECT '📝 TEST 3: Admin Notification (New User)' as section_header;
SELECT '=====================================================' as separator;

SELECT '⚠️ NOTE: We will NOT create a real test user' as note;
SELECT '   Instead, we will manually insert into admin_notification_log' as note;
SELECT '   This simulates what happens when a new user registers' as note;
SELECT '' as spacing;

-- Check if admin_notification_log exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notification_log') THEN
        RAISE EXCEPTION '❌ admin_notification_log table does not exist - migration 044 not applied';
    END IF;
END $$;

-- Get an existing user for testing
SELECT 
    '👤 Using existing user for test:' as info,
    id,
    username,
    full_name,
    email,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 1;

-- Manually insert into admin_notification_log to trigger webhook
SELECT 'Inserting test admin notification...' as status;

INSERT INTO admin_notification_log (
    notification_type,
    record_id,
    metadata
)
SELECT 
    'new_user',
    id,
    jsonb_build_object(
        'username', username,
        'full_name', full_name,
        'created_at', created_at
    )
FROM profiles
ORDER BY created_at DESC
LIMIT 1
RETURNING 
    id as log_id,
    notification_type,
    record_id,
    '✅ Admin notification log created' as status,
    'This should trigger webhook to send email to frothmonkeyca@gmail.com' as next_step;

SELECT '' as spacing;
SELECT '⚠️ IMPORTANT: Check Email Inbox' as note;
SELECT '   → Check: frothmonkeyca@gmail.com' as instruction;
SELECT '   → Look for "New User Registered" email' as instruction;
SELECT '   → Also check Resend Dashboard: https://resend.com/emails' as instruction;
SELECT '' as spacing;

SELECT '=====================================================' as separator;
SELECT '🧹 CLEANUP (Optional)' as section_header;
SELECT '=====================================================' as separator;

SELECT '' as spacing;
SELECT 'To clean up test data, run these commands:' as info;
SELECT '' as spacing;
SELECT '-- Delete test questions' as info;
SELECT 'DELETE FROM auction_questions' as info;
SELECT 'WHERE listing_id = ''3ba8cbf9-70ea-4adc-981d-758a8082cd42''' as info;
SELECT '  AND question LIKE ''%TEST QUESTION%'';' as info;
SELECT '' as spacing;
SELECT '-- Delete test notifications' as info;
SELECT 'DELETE FROM notifications' as info;
SELECT 'WHERE listing_id = ''3ba8cbf9-70ea-4adc-981d-758a8082cd42''' as info;
SELECT '  AND created_at > NOW() - INTERVAL ''5 minutes'';' as info;
SELECT '' as spacing;
SELECT '-- Delete test admin notification log' as info;
SELECT 'DELETE FROM admin_notification_log' as info;
SELECT 'WHERE sent_at > NOW() - INTERVAL ''5 minutes'';' as info;
SELECT '' as spacing;

SELECT '=====================================================' as separator;
SELECT '✅ TEST RESULTS SUMMARY' as section_header;
SELECT '=====================================================' as separator;

-- Summary of what should have happened
SELECT 
    'Expected Results:' as summary,
    '1. Question received notification created → Email to seller' as test_1,
    '2. Question answered notification created → Email to questioner' as test_2,
    '3. Admin notification log created → Email to frothmonkeyca@gmail.com' as test_3;

SELECT '' as spacing;
SELECT 'If emails were NOT sent, check:' as info;
SELECT '  1. Are database migrations applied? (Run INVESTIGATE_EMAIL_AUTOMATION.sql)' as info;
SELECT '  2. Are edge functions deployed? (send-notification-emails, send-admin-notifications)' as info;
SELECT '  3. Are webhooks configured in Supabase Dashboard?' as info;
SELECT '  4. Is RESEND_API_KEY set in edge function secrets?' as info;
SELECT '' as spacing;

SELECT '=====================================================' as separator;
SELECT '📊 DIAGNOSTIC INFO' as section_header;
SELECT '=====================================================' as separator;

-- Show webhook configuration guidance
SELECT 
    'Webhook Configuration Checklist:' as guide;

SELECT 
    'Webhook 1: Send Notification Emails' as webhook,
    'Table: notifications' as table_name,
    'Events: INSERT' as events,
    'Type: Edge Function' as type,
    'Edge Function: send-notification-emails' as function_name,
    'Purpose: Sends emails for Q&A notifications' as purpose;

SELECT 
    'Webhook 2: Admin Notification - New User' as webhook,
    'Table: admin_notification_log' as table_name,
    'Events: INSERT' as events,
    'Condition: notification_type eq new_user' as condition,
    'Type: Edge Function' as type,
    'Edge Function: send-admin-notifications' as function_name,
    'Purpose: Sends email to admin when new user registers' as purpose;

SELECT 
    'Webhook 3: Admin Notification - New Listing' as webhook,
    'Table: admin_notification_log' as table_name,
    'Events: INSERT' as events,
    'Condition: notification_type eq new_listing' as condition,
    'Type: Edge Function' as type,
    'Edge Function: send-admin-notifications' as function_name,
    'Purpose: Sends email to admin when new listing is created' as purpose;

