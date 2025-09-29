-- Check what notification-related objects already exist in your database
-- Run this in Supabase SQL Editor to see what's already there

-- Check if notifications table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
        THEN '✅ notifications table EXISTS' 
        ELSE '❌ notifications table MISSING' 
    END as table_status;

-- Check table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- Check existing policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%';

-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%notification%' 
   OR routine_name LIKE '%notify%';

-- Check if notification_preferences column exists in profiles
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
        ) 
        THEN '✅ notification_preferences column EXISTS' 
        ELSE '❌ notification_preferences column MISSING' 
    END as column_status;

-- Count existing notifications (if table exists)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
        THEN (SELECT COUNT(*)::text || ' notifications exist' FROM notifications)
        ELSE 'notifications table does not exist'
    END as notification_count;

