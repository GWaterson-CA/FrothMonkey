-- VERIFY CRON JOB AND AUTOMATION IS WORKING
-- ===========================================
-- Run this script to verify your auction finalization automation

-- ===========================================
-- STEP 1: Verify Cron Job Exists and is Active
-- ===========================================
SELECT 
    '✅ CRON JOB STATUS' as check_type,
    jobid,
    jobname,
    schedule,
    command,
    CASE 
        WHEN active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status,
    nodename,
    database
FROM cron.job
WHERE jobname = 'finalize-auctions'
   OR command LIKE '%finalize_auctions%';

-- If no results, cron job doesn't exist!
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO CRON JOB FOUND - Run SETUP_CRON_VIA_SQL.sql first!'
        ELSE '✅ Cron job exists'
    END as status
FROM cron.job
WHERE jobname = 'finalize-auctions'
   OR command LIKE '%finalize_auctions%';

-- ===========================================
-- STEP 2: Check for Stuck Auctions (Should be 0)
-- ===========================================
SELECT 
    '📊 STUCK AUCTIONS CHECK' as check_type,
    COUNT(*) as stuck_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No stuck auctions - automation working!'
        WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*) || ' auctions need finalization'
        ELSE '✅ Good'
    END as status
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time;

-- Show stuck auctions details
SELECT 
    '📋 STUCK AUCTION DETAILS' as check_type,
    id,
    title,
    status,
    end_time,
    NOW() - end_time as time_overdue,
    CASE 
        WHEN NOW() - end_time > INTERVAL '1 day' THEN '⚠️ Overdue by ' || EXTRACT(EPOCH FROM (NOW() - end_time))/86400 || ' days'
        WHEN NOW() - end_time > INTERVAL '1 hour' THEN '⚠️ Overdue by ' || EXTRACT(EPOCH FROM (NOW() - end_time))/3600 || ' hours'
        ELSE '⚠️ Recently overdue'
    END as severity
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time
ORDER BY end_time ASC
LIMIT 10;

-- ===========================================
-- STEP 3: Manually Test the Function
-- ===========================================
-- Run this to manually trigger finalization (for testing)
-- This simulates what the cron job does
SELECT 
    '🧪 MANUAL TEST' as check_type,
    finalize_auctions() as auctions_finalized,
    'Run this to manually finalize auctions right now' as note;

-- ===========================================
-- STEP 4: Check Recent Status Changes
-- ===========================================
-- This shows listings that were recently finalized (in last hour)
SELECT 
    '📈 RECENT FINALIZATIONS' as check_type,
    id,
    title,
    status,
    end_time,
    updated_at,
    NOW() - updated_at as time_since_update,
    CASE 
        WHEN updated_at > NOW() - INTERVAL '10 minutes' THEN '✅ Just finalized'
        WHEN updated_at > NOW() - INTERVAL '1 hour' THEN '✅ Recently finalized'
        ELSE 'Old'
    END as recency
FROM listings
WHERE status IN ('ended', 'sold')
  AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 10;

-- ===========================================
-- STEP 5: Check Cron Job Execution History
-- ===========================================
-- Check if cron job has been running (if available)
SELECT 
    '📜 CRON JOB HISTORY' as check_type,
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid IN (
    SELECT jobid FROM cron.job WHERE jobname = 'finalize-auctions'
)
ORDER BY start_time DESC
LIMIT 10;

-- ===========================================
-- STEP 6: Verify Notifications Are Being Created
-- ===========================================
-- Check if notifications were created for finalized listings
SELECT 
    '🔔 RECENT NOTIFICATIONS' as check_type,
    COUNT(*) as notification_count,
    COUNT(DISTINCT listing_id) as listings_with_notifications
FROM notifications
WHERE type IN ('listing_ended_seller', 'auction_won')
  AND created_at > NOW() - INTERVAL '1 hour';

-- Show recent notifications
SELECT 
    '📧 NOTIFICATION DETAILS' as check_type,
    id,
    user_id,
    type,
    title,
    listing_id,
    created_at,
    NOW() - created_at as time_ago
FROM notifications
WHERE type IN ('listing_ended_seller', 'auction_won')
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- STEP 7: Create Test Listing (Optional)
-- ===========================================
-- Uncomment this to create a test listing that ends in 2 minutes
-- This is useful for end-to-end testing
/*
INSERT INTO listings (
    owner_id,
    title,
    description,
    category_id,
    start_price,
    current_price,
    status,
    start_time,
    end_time
) VALUES (
    'YOUR_USER_ID_HERE',  -- Replace with your user ID
    'TEST LISTING - Auto Finalize',
    'This listing will end in 2 minutes for testing',
    (SELECT id FROM categories LIMIT 1),  -- Use first category
    10.00,
    10.00,
    'live',
    NOW(),
    NOW() + INTERVAL '2 minutes'
) RETURNING id, title, end_time;
*/

-- ===========================================
-- SUMMARY
-- ===========================================
SELECT 
    '📊 SUMMARY' as check_type,
    (SELECT COUNT(*) FROM cron.job WHERE jobname = 'finalize-auctions') as cron_job_exists,
    (SELECT COUNT(*) FROM listings WHERE status = 'live' AND NOW() >= end_time) as stuck_auctions,
    (SELECT COUNT(*) FROM listings WHERE status IN ('ended', 'sold') AND updated_at > NOW() - INTERVAL '1 hour') as recent_finalizations,
    (SELECT COUNT(*) FROM notifications WHERE type IN ('listing_ended_seller', 'auction_won') AND created_at > NOW() - INTERVAL '1 hour') as recent_notifications,
    CASE 
        WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname = 'finalize-auctions') > 0 
         AND (SELECT COUNT(*) FROM listings WHERE status = 'live' AND NOW() >= end_time) = 0
        THEN '✅ Automation appears to be working!'
        WHEN (SELECT COUNT(*) FROM cron.job WHERE jobname = 'finalize-auctions') = 0
        THEN '❌ Cron job not found'
        WHEN (SELECT COUNT(*) FROM listings WHERE status = 'live' AND NOW() >= end_time) > 0
        THEN '⚠️ Some auctions are stuck - cron may not be running'
        ELSE '⚠️ Check individual results above'
    END as overall_status;

