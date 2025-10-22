-- =====================================================
-- CLEANUP TEST DATA
-- =====================================================
-- Run this after testing to remove test questions,
-- notifications, and admin logs created during testing
-- =====================================================

SELECT '=====================================================' as separator;
SELECT '🧹 CLEANING UP TEST DATA' as section_header;
SELECT '=====================================================' as separator;

-- Test listing ID: 3ba8cbf9-70ea-4adc-981d-758a8082cd42

-- Count what will be deleted
SELECT 
    '📊 Items to be deleted:' as info;

SELECT 
    'Test Questions' as item_type,
    COUNT(*) as count
FROM auction_questions
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND (question LIKE '%TEST QUESTION%' OR question LIKE '%test question%');

SELECT 
    'Test Notifications' as item_type,
    COUNT(*) as count
FROM notifications
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '1 hour';

SELECT 
    'Test Admin Logs' as item_type,
    COUNT(*) as count
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '1 hour';

SELECT '' as spacing;
SELECT 'Deleting test data...' as status;
SELECT '' as spacing;

-- Delete test questions
DELETE FROM auction_questions
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND (question LIKE '%TEST QUESTION%' OR question LIKE '%test question%')
RETURNING 
    id,
    question,
    '✅ Deleted' as status;

-- Delete test notifications
DELETE FROM notifications
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
  AND created_at > NOW() - INTERVAL '1 hour'
RETURNING 
    id,
    type,
    title,
    '✅ Deleted' as status;

-- Delete test admin notification logs
DELETE FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '1 hour'
  AND metadata->>'username' IS NOT NULL
RETURNING 
    id,
    notification_type,
    metadata->>'username' as username,
    '✅ Deleted' as status;

SELECT '' as spacing;
SELECT '✅ Cleanup complete!' as status;
SELECT '' as spacing;

