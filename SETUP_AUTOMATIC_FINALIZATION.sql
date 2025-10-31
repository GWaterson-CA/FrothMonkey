-- Quick Setup Script for Auction Finalization Cron Job
-- ====================================================
-- This script provides SQL commands you can use to set up the cron job
-- Note: pg_cron requires superuser privileges, so you may need to use
-- Supabase Dashboard instead of SQL

-- Option 1: Using Supabase Dashboard (RECOMMENDED)
-- ====================================================
-- 1. Go to: Supabase Dashboard > Database > Cron Jobs
-- 2. Click "Create a new cron job"
-- 3. Use these settings:
--    Name: finalize-auctions
--    Schedule: */5 * * * *
--    SQL: SELECT finalize_auctions();
-- 4. Save

-- Option 2: Using SQL (if you have superuser access)
-- ====================================================
-- WARNING: This may not work if you don't have pg_cron superuser privileges
-- Uncomment and run if you have the necessary permissions:

/*
-- Check if pg_cron extension exists
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Schedule the job (every 5 minutes)
SELECT cron.schedule(
    'finalize-auctions',
    '*/5 * * * *',  -- Every 5 minutes
    'SELECT finalize_auctions();'
);

-- Verify it was created
SELECT * FROM cron.job WHERE jobname = 'finalize-auctions';
*/

-- Option 3: Check Current Setup
-- ====================================================
-- Run this to see if cron job already exists:

SELECT 
    'Cron Job Status' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Cron job exists'
        ELSE '❌ No cron job found - needs to be created'
    END as status,
    COUNT(*) as job_count
FROM cron.job
WHERE command LIKE '%finalize_auctions%' 
   OR jobname LIKE '%finalize%';

-- Show details of existing cron jobs
SELECT 
    jobid,
    schedule,
    command,
    jobname,
    active,
    CASE 
        WHEN active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM cron.job
WHERE command LIKE '%finalize_auctions%' 
   OR command LIKE '%schedule_auction_finalization%'
   OR jobname LIKE '%finalize%';

-- Check how many auctions need finalization RIGHT NOW
SELECT 
    'Auctions Needing Finalization' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️ These auctions should have been finalized'
        ELSE '✅ No auctions stuck'
    END as status
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time;

-- Show stuck auctions
SELECT 
    id,
    title,
    status,
    end_time,
    NOW() - end_time as time_overdue,
    CASE 
        WHEN NOW() - end_time > INTERVAL '1 day' THEN '⚠️ Overdue by more than 1 day'
        WHEN NOW() - end_time > INTERVAL '1 hour' THEN '⚠️ Overdue by more than 1 hour'
        ELSE '⚠️ Recently overdue'
    END as severity
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time
ORDER BY end_time ASC
LIMIT 10;

