-- Add answer_images column to auction_questions table
-- This will store paths to images attached to answers
ALTER TABLE auction_questions 
ADD COLUMN answer_images TEXT[] DEFAULT NULL;

-- Create index for questions with images
CREATE INDEX idx_auction_questions_with_images ON auction_questions(listing_id) 
WHERE answer_images IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN auction_questions.answer_images IS 'Array of image paths stored in Supabase storage that are attached to the answer';

