-- Explanation: Status vs End Time
-- ============================================
-- 
-- They are DIFFERENT FIELDS:
--
-- 1. `status` - An ENUM field with values:
--    - 'draft' (not published)
--    - 'scheduled' (will start at start_time)
--    - 'live' (currently active auction)
--    - 'ended' (auction ended, no bids or reserve not met)
--    - 'sold' (auction ended successfully)
--    - 'cancelled' (auction cancelled)
--
-- 2. `end_time` - A TIMESTAMP field (when auction should end)
--
-- THE LOGIC ISSUE:
-- ============================================
-- 
-- The `end_time` field is just a timestamp - it doesn't automatically change `status`.
-- You need a function (`finalize_auctions()`) to run periodically that:
--   1. Finds listings WHERE status = 'live' AND NOW() >= end_time
--   2. Updates status from 'live' to 'ended' or 'sold'
--   3. This status change triggers the notification emails
--
-- CURRENT PROBLEM:
-- ============================================
-- 
-- The `finalize_auctions()` function exists but needs to be scheduled to run.
-- If the cron job isn't configured or not running, listings stay 'live' forever!
--
-- FIX FOR THIS LISTING:
-- ============================================

-- Step 0: Fix the notification type constraint (REQUIRED FIRST!)
-- The constraint doesn't include 'listing_ended_seller' but the function uses it
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'question_received',
    'question_answered',
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'listing_ended_seller',  -- ADD THIS! Required by notify_auction_ended()
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

-- Step 1: Manually finalize this specific listing
UPDATE listings 
SET status = 'ended', updated_at = NOW()
WHERE id = '7873d469-d927-49c6-82e9-09d9e13d65eb'
  AND status = 'live'
  AND NOW() >= end_time;

-- Step 2: Verify the update worked
SELECT 
    id,
    title,
    status,
    end_time,
    NOW() as current_time,
    CASE 
        WHEN status = 'ended' THEN '✅ Status updated - trigger should fire!'
        WHEN status = 'live' AND NOW() >= end_time THEN '❌ Still live - update failed'
        ELSE '⚠️ Status: ' || status
    END as status_check
FROM listings
WHERE id = '7873d469-d927-49c6-82e9-09d9e13d65eb';

-- Step 3: Check if notifications were created (should be automatic via trigger)
SELECT 
    '🔔 Notification Check' as section,
    id,
    user_id,
    type,
    title,
    message,
    created_at,
    metadata
FROM notifications
WHERE listing_id = '7873d469-d927-49c6-82e9-09d9e13d65eb'
ORDER BY created_at DESC;

-- CHECK IF CRON JOB IS CONFIGURED:
-- ============================================
-- Go to Supabase Dashboard > Database > Cron Jobs
-- Look for a job named: "finalize_auctions" or "schedule_auction_finalization"
-- Schedule should be: "*/1 * * * *" (every minute) or "0 * * * *" (every hour)
-- SQL command should be: "SELECT finalize_auctions();" or "SELECT schedule_auction_finalization();"

-- If cron job doesn't exist, you need to create it OR manually run finalize_auctions() periodically

