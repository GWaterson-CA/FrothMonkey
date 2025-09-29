-- =====================================================
-- Check if profiles table has notification_preferences
-- =====================================================
-- This column is needed by the create_notification function
-- =====================================================

-- Check if notification_preferences column exists
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'notification_preferences';

-- If the above returns empty, run this to add it:
-- ALTER TABLE profiles 
-- ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb;

-- =====================================================
-- Also check for bidding_agreement_accepted_at column
-- =====================================================

SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'bidding_agreement_accepted_at';

-- If empty, run:
-- ALTER TABLE profiles 
-- ADD COLUMN IF NOT EXISTS bidding_agreement_accepted_at TIMESTAMPTZ NULL;

-- =====================================================
-- Show all columns in profiles table
-- =====================================================

SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
