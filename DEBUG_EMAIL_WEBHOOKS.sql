-- =====================================================
-- DEBUG EMAIL WEBHOOKS - Find Why Emails Aren't Sending
-- =====================================================

SELECT '=====================================================' as separator;
SELECT '🔍 STEP 1: Check if test data was created' as section_header;
SELECT '=====================================================' as separator;

-- Check if test notifications were created
SELECT 
    'Test Notifications Created' as check,
    COUNT(*) as count,
    STRING_AGG(DISTINCT type, ', ') as types
FROM notifications
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '10 minutes';

-- Check if admin notifications were logged
SELECT 
    'Admin Notifications Logged' as check,
    COUNT(*) as count,
    STRING_AGG(DISTINCT notification_type, ', ') as types
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '10 minutes';

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔍 STEP 2: Verify webhooks exist in Supabase' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    '⚠️ MANUAL CHECK REQUIRED' as note,
    'Go to Supabase Dashboard → Database → Webhooks' as action,
    'Verify these webhooks exist and are enabled:' as instruction;

SELECT 
    'Webhook 1' as webhook,
    'Send Notifications Email' as name,
    'notifications table → send-notification-emails function' as config;

SELECT 
    'Webhook 2' as webhook,
    'Admin Notification - New User' as name,
    'admin_notification_log table → send-admin-notifications function' as config;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔍 STEP 3: Check Edge Functions Deployment' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    '⚠️ MANUAL CHECK REQUIRED' as note,
    'Go to Supabase Dashboard → Edge Functions' as action,
    'Verify these functions are deployed:' as instruction;

SELECT 
    'Function 1' as function,
    'send-notification-emails' as name,
    'Should show "Deployed" status with recent deployment date' as check;

SELECT 
    'Function 2' as function,
    'send-admin-notifications' as name,
    'Should show "Deployed" status with recent deployment date' as check;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔍 STEP 4: Check Edge Function Secrets' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    '⚠️ MANUAL CHECK REQUIRED' as note,
    'For EACH edge function, check Settings → Environment Variables:' as action;

SELECT 
    'Required Secret 1' as secret,
    'RESEND_API_KEY' as name,
    're_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt' as value_should_be;

SELECT 
    'Required Secret 2' as secret,
    'APP_URL' as name,
    'https://frothmonkey.com' as value_should_be;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔍 STEP 5: Most Recent Test Data Details' as section_header;
SELECT '=====================================================' as separator;

-- Show the most recent test notifications
SELECT 
    'Most Recent Q&A Notifications:' as info,
    id,
    type,
    user_id,
    listing_id,
    created_at,
    'Should have triggered webhook' as expected
FROM notifications
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Show the most recent admin notification
SELECT 
    'Most Recent Admin Notification Log:' as info,
    id,
    notification_type,
    record_id,
    sent_at,
    success,
    'Should have triggered webhook' as expected
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '10 minutes'
ORDER BY sent_at DESC
LIMIT 5;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '📋 DIAGNOSTIC SUMMARY' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    '✅ IF YOU SEE DATA ABOVE:' as status,
    'Database triggers ARE working - notifications are being created' as meaning;

SELECT 
    '❌ IF NO EMAILS IN RESEND:' as status,
    'The problem is with webhooks or edge functions' as meaning;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '🔧 NEXT STEPS TO DEBUG' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    'Step 1' as step,
    'Check Webhook Logs' as action,
    'Supabase → Database → Webhooks → Click webhook name → Logs tab' as where_to_go,
    'Look for recent requests and any errors' as what_to_check;

SELECT 
    'Step 2' as step,
    'Check Edge Function Logs' as action,
    'Supabase → Edge Functions → Click function name → Logs tab' as where_to_go,
    'Look for recent invocations and any errors' as what_to_check;

SELECT 
    'Step 3' as step,
    'Verify Edge Functions Are Deployed' as action,
    'Supabase → Edge Functions' as where_to_go,
    'Both functions should show "Deployed" status' as what_to_check;

SELECT 
    'Step 4' as step,
    'Verify Secrets Are Set' as action,
    'Supabase → Edge Functions → Click function → Settings' as where_to_go,
    'RESEND_API_KEY and APP_URL must be set for BOTH functions' as what_to_check;

SELECT '' as spacing;
SELECT '=====================================================' as separator;
SELECT '💡 MOST LIKELY ISSUES' as section_header;
SELECT '=====================================================' as separator;

SELECT 
    'Issue 1 (Most Common)' as issue,
    'Edge functions not deployed yet' as problem,
    'Deploy via Supabase Dashboard → Edge Functions → Upload files' as solution;

SELECT 
    'Issue 2' as issue,
    'RESEND_API_KEY not set in edge function secrets' as problem,
    'Set in: Edge Functions → Click function → Settings → Environment Variables' as solution;

SELECT 
    'Issue 3' as issue,
    'Webhooks not properly configured' as problem,
    'Verify webhook is pointing to correct function name' as solution;

SELECT 
    'Issue 4' as issue,
    'Edge function has runtime errors' as problem,
    'Check edge function logs for error messages' as solution;

