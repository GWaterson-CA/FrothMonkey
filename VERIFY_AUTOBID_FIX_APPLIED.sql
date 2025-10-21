-- Script to verify if the autobid max priority fix has been applied
-- Run this BEFORE and AFTER applying the fix to see the difference

-- Check if the fix is present by looking for the CASE WHEN logic
SELECT 
    CASE 
        WHEN prosrc LIKE '%CASE WHEN ab.max_amount = v_required_min THEN 0 ELSE 1 END%' 
        THEN '✅ FIX IS APPLIED - Users at their max will get priority'
        ELSE '❌ FIX NOT APPLIED - Old logic still in place (highest max always wins)'
    END as fix_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'process_auto_bids';

