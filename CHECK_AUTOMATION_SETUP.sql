-- Check if cron job is configured for auction finalization
-- =====================================================

-- Check if pg_cron extension is enabled
SELECT 
    '📋 PG_CRON EXTENSION CHECK' as section,
    extname as extension_name,
    extversion as version
FROM pg_extension
WHERE extname = 'pg_cron';

-- Check if cron job exists for finalize_auctions
SELECT 
    '⏰ CRON JOB CHECK' as section,
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE command LIKE '%finalize_auctions%' 
   OR command LIKE '%schedule_auction_finalization%'
   OR jobname LIKE '%finalize%';

-- Manual check instructions:
SELECT 
    '📝 MANUAL CHECK REQUIRED' as section,
    'Go to Supabase Dashboard > Database > Cron Jobs' as step_1,
    'Look for a job that calls finalize_auctions() or schedule_auction_finalization()' as step_2,
    'If no job exists, you need to create one!' as step_3;

-- Check for any other scheduled jobs
SELECT 
    '🔍 ALL CRON JOBS' as section,
    jobid,
    schedule,
    command,
    jobname,
    active
FROM cron.job
ORDER BY jobid;

-- Check if edge function exists (alternative to cron)
SELECT 
    '🌐 EDGE FUNCTION CHECK' as section,
    'Manual check: Go to Supabase Dashboard > Edge Functions' as instruction,
    'Look for function named: finalize-auctions' as function_name,
    'If it exists, you can call it via external cron service' as note;

