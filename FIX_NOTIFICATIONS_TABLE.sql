-- =====================================================
-- FIX NOTIFICATIONS TABLE - Add Missing Column
-- =====================================================
-- The error shows: column "related_user_id" does not exist
-- This adds the missing column to the notifications table
-- =====================================================

-- Add the missing related_user_id column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add the missing metadata column (just in case)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Verify all columns exist now
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- =====================================================
-- Expected columns:
-- - id (uuid)
-- - user_id (uuid)
-- - type (text)
-- - title (text)
-- - message (text)
-- - listing_id (uuid)
-- - related_user_id (uuid) <- THIS WAS MISSING
-- - metadata (jsonb)
-- - read_at (timestamptz)
-- - created_at (timestamptz)
-- =====================================================
