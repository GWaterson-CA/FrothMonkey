-- Fix: Add Contact Exchange Notification Types to Constraint
-- ============================================================
-- Error: notifications_type_check constraint is missing contact exchange types
-- The create_contact_exchange() function uses these types:
--   - contact_shared
--   - contact_approval_needed
--   - contact_approved
--   - contact_declined
--   - new_message (used by messaging API)
--
-- This updates the constraint to include ALL notification types including contact exchange types

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
    
    -- Contact Exchange notifications (NEW - ADDED)
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
    '✅ CONSTRAINT UPDATED WITH CONTACT EXCHANGE TYPES' as status,
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

-- Test: Verify all contact exchange types are now allowed
SELECT 
    '✅ VERIFICATION' as test,
    CASE 
        WHEN check_clause LIKE '%contact_shared%' 
         AND check_clause LIKE '%contact_approval_needed%'
         AND check_clause LIKE '%contact_approved%'
         AND check_clause LIKE '%contact_declined%'
         AND check_clause LIKE '%new_message%'
        THEN 'All contact exchange types are in constraint'
        ELSE 'ERROR: Some types missing'
    END as result
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check';

