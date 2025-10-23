-- Simplified Q&A Test - Let's see what's actually happening

SELECT '🔍 Step 1: Check if test listing exists' as step;
SELECT id, title, owner_id, status
FROM listings
WHERE id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

SELECT '' as spacing;
SELECT '🔍 Step 2: Check current_user' as step;
SELECT current_user;

SELECT '' as spacing;
SELECT '🔍 Step 3: Find a valid profile to use for testing' as step;
SELECT id, username, full_name
FROM profiles
ORDER BY created_at DESC
LIMIT 3;

SELECT '' as spacing;
SELECT '🔍 Step 4: Check existing questions on this listing' as step;
SELECT id, question, answer, questioner_id, created_at
FROM auction_questions
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42'
ORDER BY created_at DESC
LIMIT 5;

SELECT '' as spacing;
SELECT '🔍 Step 5: Check if create_notification function exists' as step;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'create_notification'
  AND routine_schema = 'public';

SELECT '' as spacing;
SELECT '🔍 Step 6: Try to manually insert a test question with a known user ID' as step;
SELECT 'About to insert a question using the most recent user...' as info;

-- Insert a test question using a real user ID
DO $$
DECLARE
    test_user_id UUID;
    test_question_id UUID;
BEGIN
    -- Get a real user ID
    SELECT id INTO test_user_id
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'Using user ID: %', test_user_id;
    
    -- Insert the question
    INSERT INTO auction_questions (listing_id, questioner_id, question)
    VALUES (
        '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
        test_user_id,
        'SIMPLE TEST: Does this trigger work? (Testing Q&A notifications)'
    )
    RETURNING id INTO test_question_id;
    
    RAISE NOTICE 'Question created with ID: %', test_question_id;
    
    -- Wait a moment
    PERFORM pg_sleep(2);
    
    -- Check if notification was created
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE type = 'question_received' 
        AND created_at > NOW() - INTERVAL '10 seconds'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: Notification was created!';
    ELSE
        RAISE NOTICE '❌ FAILED: No notification was created';
    END IF;
END $$;

SELECT '' as spacing;
SELECT '📊 Step 7: Check if notification was created' as step;
SELECT 
    id,
    type,
    user_id,
    title,
    message,
    created_at
FROM notifications
WHERE type = 'question_received'
  AND created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC
LIMIT 1;

SELECT '' as spacing;
SELECT '📋 RESULT' as final_check;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Trigger is working! Notification created.'
        ELSE '❌ Trigger failed - no notification created'
    END as result
FROM notifications
WHERE type = 'question_received'
  AND created_at > NOW() - INTERVAL '1 minute';

