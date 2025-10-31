-- SETUP AUTOMATIC AUCTION FINALIZATION
-- =====================================
-- Since Cron Jobs option isn't visible in Dashboard, use these methods:

-- METHOD 1: Enable pg_cron Extension and Schedule via SQL
-- ========================================================
-- Step 1: Enable pg_cron extension
-- Go to Supabase Dashboard > Database > Extensions
-- Find "pg_cron" and click "Enable" (or run SQL below)

-- Enable pg_cron extension (run this in SQL Editor)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule the finalize_auctions function
-- Run this in SQL Editor (after enabling pg_cron):
SELECT cron.schedule(
    'finalize-auctions',           -- Job name
    '*/5 * * * *',                 -- Every 5 minutes
    'SELECT finalize_auctions();'  -- SQL to execute
);

-- Verify it was created:
SELECT * FROM cron.job WHERE jobname = 'finalize-auctions';

-- METHOD 2: Check if pg_cron is enabled
-- ========================================================
-- Run this first to see if pg_cron is available:
SELECT 
    extname as extension_name,
    extversion as version,
    CASE 
        WHEN extname = 'pg_cron' THEN '✅ pg_cron is enabled'
        ELSE '❌ pg_cron not found'
    END as status
FROM pg_extension
WHERE extname = 'pg_cron';

-- METHOD 3: Alternative - Use Edge Function + External Cron
-- ========================================================
-- If pg_cron doesn't work, use the edge function with external cron
-- See SETUP_EDGE_FUNCTION_CRON.md for details

