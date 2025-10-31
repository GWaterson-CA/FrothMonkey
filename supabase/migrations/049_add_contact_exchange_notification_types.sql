-- Migration: Add Contact Exchange Notification Types to Constraint
-- Issue: Migration 026_auction_contact_exchange.sql creates functions that use
-- notification types that aren't in the notifications_type_check constraint:
--   - contact_shared
--   - contact_approval_needed
--   - contact_approved
--   - contact_declined
--   - new_message
-- This causes constraint violations when creating contact exchanges.

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
    
    -- Auction end notifications
    'listing_ended',
    'listing_ended_seller',
    'auction_sold',
    'auction_ended',
    'auction_ended_no_reserve',
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
    
    -- Contact Exchange notifications (NEW)
    'contact_shared',
    'contact_approval_needed',
    'contact_approved',
    'contact_declined',
    'new_message',
    
    -- Other
    'listing_reported'
));

-- Verify the constraint was updated
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

