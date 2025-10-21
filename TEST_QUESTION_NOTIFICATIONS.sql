-- TEST SCRIPT FOR Q&A EMAIL NOTIFICATIONS
-- This script tests the question notification system
-- Run this in your Supabase SQL Editor

-- ============================================
-- SETUP: Create test users and listing
-- ============================================

-- Note: Replace these with actual user IDs from your system
-- or create test users first

DO $$
DECLARE
    seller_id UUID;
    buyer_id UUID;
    test_listing_id UUID;
    test_question_id UUID;
BEGIN
    -- Get two existing users (replace with actual user IDs)
    -- User 1 will be the seller, User 2 will ask the question
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TESTING Q&A EMAIL NOTIFICATIONS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    
    -- Get first user as seller
    SELECT id INTO seller_id
    FROM profiles
    WHERE email IS NOT NULL
    LIMIT 1;
    
    -- Get second user as buyer
    SELECT id INTO buyer_id
    FROM profiles
    WHERE email IS NOT NULL
      AND id != seller_id
    LIMIT 1 OFFSET 1;
    
    IF seller_id IS NULL OR buyer_id IS NULL THEN
        RAISE EXCEPTION 'Need at least 2 users with email addresses to run this test';
    END IF;
    
    RAISE NOTICE 'Test Users:';
    RAISE NOTICE '  Seller: %', (SELECT email FROM auth.users WHERE id = seller_id);
    RAISE NOTICE '  Buyer: %', (SELECT email FROM auth.users WHERE id = buyer_id);
    RAISE NOTICE '';
    
    -- ============================================
    -- STEP 1: Create a test listing
    -- ============================================
    
    RAISE NOTICE 'Step 1: Creating test listing...';
    
    INSERT INTO listings (
        owner_id,
        title,
        description,
        starting_price,
        current_price,
        reserve_price,
        buy_now_price,
        category,
        location,
        status,
        start_time,
        end_time
    ) VALUES (
        seller_id,
        'Test Listing for Q&A Notifications',
        'This is a test listing to verify question email notifications work correctly',
        100.00,
        100.00,
        150.00,
        200.00,
        'electronics',
        'Test City',
        'live',
        NOW(),
        NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO test_listing_id;
    
    RAISE NOTICE '✅ Created test listing: %', test_listing_id;
    RAISE NOTICE '';
    
    -- ============================================
    -- STEP 2: Ask a question (trigger question_received)
    -- ============================================
    
    RAISE NOTICE 'Step 2: Asking a question...';
    
    INSERT INTO auction_questions (
        listing_id,
        questioner_id,
        question
    ) VALUES (
        test_listing_id,
        buyer_id,
        'Is this item in good condition? Does it come with all accessories?'
    )
    RETURNING id INTO test_question_id;
    
    RAISE NOTICE '✅ Created question: %', test_question_id;
    RAISE NOTICE '';
    
    -- Wait a moment for trigger to fire
    PERFORM pg_sleep(1);
    
    -- Check if notification was created
    IF EXISTS (
        SELECT 1 FROM notifications
        WHERE listing_id = test_listing_id
          AND type = 'question_received'
          AND user_id = seller_id
    ) THEN
        RAISE NOTICE '✅ question_received notification created successfully';
    ELSE
        RAISE WARNING '❌ question_received notification was NOT created!';
    END IF;
    RAISE NOTICE '';
    
    -- ============================================
    -- STEP 3: Answer the question (trigger question_answered)
    -- ============================================
    
    RAISE NOTICE 'Step 3: Answering the question...';
    
    UPDATE auction_questions
    SET 
        answer = 'Yes, the item is in excellent condition and comes with all original accessories including the box, manual, and cables.',
        answered_at = NOW()
    WHERE id = test_question_id;
    
    RAISE NOTICE '✅ Question answered';
    RAISE NOTICE '';
    
    -- Wait a moment for trigger to fire
    PERFORM pg_sleep(1);
    
    -- Check if notification was created
    IF EXISTS (
        SELECT 1 FROM notifications
        WHERE listing_id = test_listing_id
          AND type = 'question_answered'
          AND user_id = buyer_id
    ) THEN
        RAISE NOTICE '✅ question_answered notification created successfully';
    ELSE
        RAISE WARNING '❌ question_answered notification was NOT created!';
    END IF;
    RAISE NOTICE '';
    
    -- ============================================
    -- STEP 4: Display results
    -- ============================================
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TEST RESULTS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Notifications created:';
    
    -- Show notifications
    PERFORM NULL FROM (
        SELECT 
            type,
            title,
            message,
            created_at,
            (SELECT email FROM auth.users WHERE id = user_id) as recipient_email
        FROM notifications
        WHERE listing_id = test_listing_id
          AND type IN ('question_received', 'question_answered')
        ORDER BY created_at
    ) AS results;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CLEANUP OPTIONS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To keep the test data, do nothing.';
    RAISE NOTICE 'To clean up, run: DELETE FROM listings WHERE id = ''%'';', test_listing_id;
    RAISE NOTICE '(This will cascade delete questions and notifications)';
    RAISE NOTICE '';
    
END $$;

-- Display the notifications that were created
SELECT 
    '=== NOTIFICATIONS CREATED ===' as section,
    n.type,
    n.title,
    n.message,
    n.metadata,
    n.created_at,
    au.email as recipient_email,
    p.username as recipient_username
FROM notifications n
JOIN profiles p ON p.id = n.user_id
JOIN auth.users au ON au.id = n.user_id
WHERE n.type IN ('question_received', 'question_answered')
  AND n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;

-- Display the questions that were created
SELECT 
    '=== QUESTIONS & ANSWERS ===' as section,
    aq.question,
    aq.answer,
    aq.created_at,
    aq.answered_at,
    l.title as listing_title,
    questioner.email as questioner_email,
    seller.email as seller_email
FROM auction_questions aq
JOIN listings l ON l.id = aq.listing_id
JOIN auth.users questioner ON questioner.id = aq.questioner_id
JOIN auth.users seller ON seller.id = l.owner_id
WHERE aq.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY aq.created_at DESC;

-- Check email preferences
SELECT 
    '=== USER PREFERENCES ===' as section,
    au.email,
    p.notification_preferences->>'email_notifications' as email_enabled,
    p.notification_preferences->>'question_received' as question_received_enabled,
    p.notification_preferences->>'question_answered' as question_answered_enabled
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.id IN (
    SELECT DISTINCT user_id 
    FROM notifications 
    WHERE type IN ('question_received', 'question_answered')
      AND created_at > NOW() - INTERVAL '5 minutes'
);

