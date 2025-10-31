-- FIX: Add missing notification types 'auction_sold', 'auction_ended', and 'auction_ended_no_reserve'
-- ===================================================
-- Error: create_auction_notifications() uses multiple notification types
-- but these aren't all in the constraint

-- Update constraint to include ALL notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'question_received',
    'question_answered',
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'listing_ended_seller',       -- Used by notify_auction_ended()
    'auction_sold',               -- ADD THIS! Used by create_auction_notifications()
    'auction_ended',             -- ADD THIS! Used by create_auction_notifications()
    'auction_ended_no_reserve',  -- ADD THIS! Used by create_auction_notifications()
    'listing_reported',
    'bid_outbid',
    'auction_won',
    'time_warning_1h',
    'time_warning_2h',
    'time_warning_3h',
    'time_warning_6h',
    'time_warning_12h',
    'time_warning_24h',
    'time_warning_48h',
    'favorite_reserve_met',
    'favorite_ending_soon'
));

-- Verify the constraint was updated
SELECT 
    '✅ CONSTRAINT UPDATED' as status,
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

