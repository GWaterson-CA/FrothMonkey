-- ============================================================================
-- CHECK IF ANSWER IMAGES MIGRATION WAS APPLIED
-- ============================================================================
-- Run this query in Supabase SQL Editor to check the migration status
-- ============================================================================

-- Check if the answer_images column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'auction_questions' 
AND column_name = 'answer_images';

-- ============================================================================
-- EXPECTED RESULT (if migration was applied):
-- ============================================================================
-- column_name    | data_type | is_nullable | column_default
-- answer_images  | ARRAY     | YES         | NULL
-- ============================================================================

-- ============================================================================
-- IF YOU SEE NO RESULTS:
-- ============================================================================
-- The migration was NOT applied! You need to:
-- 1. Open APPLY_ANSWER_IMAGES_MIGRATION.sql
-- 2. Copy the SQL
-- 3. Run it in Supabase SQL Editor
-- ============================================================================

-- Also check recent answers to see if any have image data
SELECT 
    id,
    answer,
    answer_images,
    answered_at
FROM auction_questions
WHERE answer IS NOT NULL
ORDER BY answered_at DESC
LIMIT 5;

-- ============================================================================
-- If answer_images column shows as NULL for all rows, the migration wasn't applied
-- ============================================================================

