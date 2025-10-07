-- ============================================================================
-- ANSWER IMAGES MIGRATION
-- ============================================================================
-- This migration adds support for attaching images to Q&A answers
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Add the answer_images column
ALTER TABLE auction_questions 
ADD COLUMN IF NOT EXISTS answer_images TEXT[] DEFAULT NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_auction_questions_with_images 
ON auction_questions(listing_id) 
WHERE answer_images IS NOT NULL;

-- Step 3: Add documentation
COMMENT ON COLUMN auction_questions.answer_images IS 'Array of image paths stored in Supabase storage that are attached to the answer';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the column was added:

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'auction_questions' 
AND column_name = 'answer_images';

-- Expected result:
-- column_name    | data_type    | is_nullable
-- answer_images  | ARRAY        | YES

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If you see the answer_images column above, the migration worked!
-- Now test by answering a question with images attached.

