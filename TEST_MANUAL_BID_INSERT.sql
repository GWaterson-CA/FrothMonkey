-- Test if we can manually insert a bid
-- This will help us understand if RLS is blocking inserts

-- First, let's see if there are ANY bids on this listing
SELECT COUNT(*) as total_bids
FROM bids 
WHERE listing_id = '3ba8cbf9-70ea-4adc-981d-758a8082cd42';

-- Try to manually insert a bid for one of the test users
-- Replace 'USER_ID_HERE' with the actual UUID of geoffreywaterson@gmail.com
-- You can get this by running: SELECT id FROM auth.users WHERE email = 'geoffreywaterson@gmail.com'

-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'geoffreywaterson@gmail.com';

-- Now let's try calling set_auto_bid directly and see what error we get
-- This will show us the actual error message
DO $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'geoffreywaterson@gmail.com';
    
    -- Call set_auto_bid
    SELECT set_auto_bid(
        v_user_id,
        '3ba8cbf9-70ea-4adc-981d-758a8082cd42'::uuid,
        12
    ) INTO v_result;
    
    -- Show the result
    RAISE NOTICE 'Result: %', v_result;
END $$;

