-- =====================================================
-- Add Missing Columns to Profiles Table
-- =====================================================
-- This adds columns that the notification system needs
-- =====================================================

-- Add notification_preferences column (used by create_notification function)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb;

-- Add bidding_agreement_accepted_at column (used by place-bid API)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bidding_agreement_accepted_at TIMESTAMPTZ NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('notification_preferences', 'bidding_agreement_accepted_at');

-- =====================================================
-- Expected result: Should show both columns
-- =====================================================
