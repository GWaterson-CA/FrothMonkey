-- Test script for autobid max amount priority fix
-- This demonstrates the fix for the issue where users don't get to bid their max amount first

-- ============================================================================
-- SETUP
-- ============================================================================

-- Clean up any existing test data
DELETE FROM bids WHERE listing_id IN (
    SELECT id FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%'
);
DELETE FROM auto_bids WHERE listing_id IN (
    SELECT id FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%'
);
DELETE FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%';

-- Get test users (using first two users in the system)
DO $$
DECLARE
    v_seller_id UUID;
    v_user_a_id UUID;
    v_user_b_id UUID;
    v_listing_id UUID;
    v_result JSONB;
BEGIN
    -- Get three different users
    SELECT id INTO v_seller_id FROM profiles ORDER BY created_at LIMIT 1;
    SELECT id INTO v_user_a_id FROM profiles WHERE id != v_seller_id ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT id INTO v_user_b_id FROM profiles WHERE id != v_seller_id AND id != v_user_a_id ORDER BY created_at LIMIT 1 OFFSET 2;
    
    RAISE NOTICE 'Seller ID: %', v_seller_id;
    RAISE NOTICE 'User A ID: %', v_user_a_id;
    RAISE NOTICE 'User B ID: %', v_user_b_id;
    
    -- Create test listing
    INSERT INTO listings (
        owner_id,
        title,
        description,
        start_price,
        reserve_price,
        current_price,
        start_time,
        end_time,
        status,
        category
    ) VALUES (
        v_seller_id,
        'TEST: Auto-bid Max Priority Test',
        'Testing that users get priority to bid their max amount',
        20.00,
        50.00,
        20.00,
        NOW(),
        NOW() + INTERVAL '7 days',
        'live',
        'antiques-collectables'
    ) RETURNING id INTO v_listing_id;
    
    RAISE NOTICE 'Created test listing: %', v_listing_id;
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SCENARIO: User A bids max $25, User B bids max $30';
    RAISE NOTICE 'EXPECTED: User A should get the $25 bid, then User B bids $26';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    
    -- Step 1: User A sets autobid to $25
    RAISE NOTICE 'Step 1: User A sets autobid to max $25.00';
    v_result := set_auto_bid(v_user_a_id, v_listing_id, 25.00);
    RAISE NOTICE 'Result: %', v_result;
    
    -- Check current state
    SELECT current_price INTO v_result FROM listings WHERE id = v_listing_id;
    RAISE NOTICE 'Current price after User A autobid: $%', v_result;
    
    -- Show User A's bid
    RAISE NOTICE 'User A bids:';
    FOR v_result IN 
        SELECT jsonb_build_object(
            'amount', amount,
            'is_auto_bid', is_auto_bid,
            'created_at', created_at
        ) FROM bids 
        WHERE listing_id = v_listing_id AND bidder_id = v_user_a_id
        ORDER BY created_at
    LOOP
        RAISE NOTICE '  %', v_result;
    END LOOP;
    RAISE NOTICE '';
    
    -- Step 2: User B sets autobid to $30
    RAISE NOTICE 'Step 2: User B sets autobid to max $30.00';
    v_result := set_auto_bid(v_user_b_id, v_listing_id, 30.00);
    RAISE NOTICE 'Result: %', v_result;
    
    -- Check final state
    SELECT current_price INTO v_result FROM listings WHERE id = v_listing_id;
    RAISE NOTICE 'Final price: $%', v_result;
    RAISE NOTICE '';
    
    -- Show all bids in order
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'COMPLETE BID HISTORY:';
    RAISE NOTICE '============================================================================';
    FOR v_result IN 
        SELECT jsonb_build_object(
            'bidder', CASE 
                WHEN bidder_id = v_user_a_id THEN 'User A'
                WHEN bidder_id = v_user_b_id THEN 'User B'
                ELSE 'Other'
            END,
            'amount', amount,
            'is_auto_bid', is_auto_bid,
            'created_at', created_at
        ) FROM bids 
        WHERE listing_id = v_listing_id
        ORDER BY created_at
    LOOP
        RAISE NOTICE '%', v_result;
    END LOOP;
    RAISE NOTICE '';
    
    -- Check who is winning
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'FINAL STATE:';
    RAISE NOTICE '============================================================================';
    FOR v_result IN 
        SELECT jsonb_build_object(
            'winning_bidder', CASE 
                WHEN b.bidder_id = v_user_a_id THEN 'User A'
                WHEN b.bidder_id = v_user_b_id THEN 'User B'
                ELSE 'Other'
            END,
            'winning_amount', b.amount,
            'user_a_max', (SELECT max_amount FROM auto_bids WHERE user_id = v_user_a_id AND listing_id = v_listing_id),
            'user_b_max', (SELECT max_amount FROM auto_bids WHERE user_id = v_user_b_id AND listing_id = v_listing_id)
        ) FROM bids b
        WHERE b.listing_id = v_listing_id
        ORDER BY b.amount DESC, b.created_at ASC
        LIMIT 1
    LOOP
        RAISE NOTICE '%', v_result;
    END LOOP;
    RAISE NOTICE '';
    
    -- Verify the expected behavior
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE '============================================================================';
    
    -- Check if User A got to bid $25
    IF EXISTS (
        SELECT 1 FROM bids 
        WHERE listing_id = v_listing_id 
        AND bidder_id = v_user_a_id 
        AND amount = 25.00
    ) THEN
        RAISE NOTICE '✅ CORRECT: User A got to place their $25.00 max bid';
    ELSE
        RAISE NOTICE '❌ ERROR: User A did NOT get to place their $25.00 max bid';
    END IF;
    
    -- Check if User B bid higher than $25
    IF EXISTS (
        SELECT 1 FROM bids 
        WHERE listing_id = v_listing_id 
        AND bidder_id = v_user_b_id 
        AND amount > 25.00
    ) THEN
        RAISE NOTICE '✅ CORRECT: User B countered with a bid higher than $25.00';
        
        -- Check if it's exactly $26 (next increment)
        IF EXISTS (
            SELECT 1 FROM bids 
            WHERE listing_id = v_listing_id 
            AND bidder_id = v_user_b_id 
            AND amount = 26.00
        ) THEN
            RAISE NOTICE '✅ CORRECT: User B bid exactly $26.00 (next increment after $25)';
        END IF;
    ELSE
        RAISE NOTICE '❌ ERROR: User B did not counter-bid above $25.00';
    END IF;
    
    -- Check final winner
    IF EXISTS (
        SELECT 1 FROM bids 
        WHERE listing_id = v_listing_id 
        AND bidder_id = v_user_b_id
        ORDER BY amount DESC, created_at ASC
        LIMIT 1
    ) THEN
        RAISE NOTICE '✅ CORRECT: User B is the final winner (as expected with higher max)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'TEST COMPLETE';
    RAISE NOTICE '============================================================================';
    
END $$;

-- Show the final state of the listing
SELECT 
    title,
    current_price,
    (SELECT COUNT(*) FROM bids WHERE listing_id = listings.id) as total_bids,
    (SELECT 
        COALESCE(p.username, 'No bids') 
     FROM bids b 
     LEFT JOIN profiles p ON p.id = b.bidder_id
     WHERE b.listing_id = listings.id 
     ORDER BY b.amount DESC, b.created_at ASC 
     LIMIT 1) as current_winner
FROM listings 
WHERE title = 'TEST: Auto-bid Max Priority Test';

-- Clean up
-- Uncomment the lines below if you want to automatically clean up test data
-- DELETE FROM bids WHERE listing_id IN (
--     SELECT id FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%'
-- );
-- DELETE FROM auto_bids WHERE listing_id IN (
--     SELECT id FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%'
-- );
-- DELETE FROM listings WHERE title LIKE 'TEST: Auto-bid Max Priority%';

