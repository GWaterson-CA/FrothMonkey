-- Migration: Fix notification type constraint to include 'listing_ended_seller'
-- Issue: Migration 041 updated the constraint but didn't include 'listing_ended_seller'
-- which is used by the notify_auction_ended() function from migration 029
-- This causes constraint violations when auctions end

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'question_received',
    'question_answered',
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'listing_ended_seller',       -- REQUIRED: Used by notify_auction_ended() function
    'auction_sold',               -- REQUIRED: Used by create_auction_notifications() function
    'auction_ended',              -- REQUIRED: Used by create_auction_notifications() function
    'auction_ended_no_reserve',   -- REQUIRED: Used by create_auction_notifications() function
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
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

