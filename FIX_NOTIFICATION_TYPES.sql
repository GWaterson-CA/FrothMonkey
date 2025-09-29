-- =====================================================
-- FIX NOTIFICATION TYPES - Update CHECK Constraint
-- =====================================================
-- Error: violates check constraint "notifications_type_check"
-- The constraint doesn't allow 'bid_outbid' type
-- This removes the old constraint and adds a new one with all types
-- =====================================================

-- Drop the existing CHECK constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a new CHECK constraint with ALL notification types
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'question_received',
    'question_answered',
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'listing_reported',
    'bid_outbid',           -- THIS WAS MISSING!
    'auction_won',
    'auction_lost',
    'time_warning_24h',
    'time_warning_2h',
    'time_warning_1h',
    'watchlist_ending_soon',
    'review_pending'
));

-- Verify the constraint was updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

-- =====================================================
-- Now try placing a bid again - it should work!
-- =====================================================
