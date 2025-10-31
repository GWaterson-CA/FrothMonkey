-- COMPREHENSIVE FIX: Find and add ALL missing notification types
-- ===============================================================
-- The create_auction_notifications() function uses multiple notification types
-- that aren't in the constraint. Let's add them all.

-- Step 1: Query to find ALL notification types currently in use
-- Run this first to see what types exist
SELECT DISTINCT type, COUNT(*) as usage_count
FROM notifications
GROUP BY type
ORDER BY type;

-- Step 2: Update constraint with ALL possible notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    -- Q&A notifications
    'question_received',
    'question_answered',
    
    -- Bidding notifications
    'first_bid_received',
    'reserve_met',
    'bid_outbid',
    
    -- Auction end notifications (multiple variants)
    'listing_ended',
    'listing_ended_seller',       -- Used by notify_auction_ended()
    'auction_sold',               -- Used by create_auction_notifications()
    'auction_ended',             -- Used by create_auction_notifications()
    'auction_ended_no_reserve',  -- ADD THIS! Used by create_auction_notifications()
    'auction_won',
    
    -- Time warnings
    'time_warning_1h',
    'time_warning_2h',
    'time_warning_3h',
    'time_warning_6h',
    'time_warning_12h',
    'time_warning_24h',
    'time_warning_48h',
    
    -- Favorites
    'favorite_reserve_met',
    'favorite_ending_soon',
    
    -- Other
    'listing_reported'
));

-- Step 3: Verify the constraint
SELECT 
    '✅ CONSTRAINT UPDATED' as status,
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

