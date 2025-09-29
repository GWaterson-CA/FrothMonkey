-- =====================================================
-- QUICK DIAGNOSTIC - Run this ENTIRE query at once
-- =====================================================
-- This will show you exactly what's missing
-- =====================================================

-- Check 1: Notifications trigger
SELECT 'TRIGGER: trigger_notify_bid_placed' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.triggers 
           WHERE trigger_name = 'trigger_notify_bid_placed'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING - This is likely the problem!' END as status;

-- Check 2: create_notification function
SELECT 'FUNCTION: create_notification' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'create_notification' 
           AND routine_schema = 'public'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING - This is likely the problem!' END as status;

-- Check 3: notifications table
SELECT 'TABLE: notifications' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'notifications'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check 4: next_min_bid function
SELECT 'FUNCTION: next_min_bid' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'next_min_bid' 
           AND routine_schema = 'public'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check 5: Bids INSERT policy
SELECT 'RLS POLICY: bids INSERT' as check_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_policies 
           WHERE tablename = 'bids' 
           AND cmd = 'INSERT'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- INTERPRETING RESULTS:
-- If you see "❌ MISSING" for the trigger or create_notification:
--   → You need to run: supabase/migrations/023_notifications_system_safe.sql
--
-- If you see "❌ MISSING" for next_min_bid:
--   → You need to run: supabase/migrations/001_initial_schema.sql
--
-- If you see "❌ MISSING" for RLS policy:
--   → You need to add RLS policies for the bids table
-- =====================================================
