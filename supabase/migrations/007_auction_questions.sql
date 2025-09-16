-- Create auction questions table
CREATE TABLE auction_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    questioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NULL,
    answered_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_auction_questions_listing_id ON auction_questions(listing_id);
CREATE INDEX idx_auction_questions_listing_answered ON auction_questions(listing_id, answered_at);

-- Enable Row Level Security
ALTER TABLE auction_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auction_questions

-- Anyone can view answered questions for non-draft listings
CREATE POLICY "Public can view answered questions" ON auction_questions
    FOR SELECT USING (
        answer IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND status != 'draft'
        )
    );

-- Questioners can view their own questions
CREATE POLICY "Questioners can view own questions" ON auction_questions
    FOR SELECT USING (auth.uid() = questioner_id);

-- Listing owners can view all questions for their listings
CREATE POLICY "Listing owners can view questions" ON auction_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );

-- Authenticated users can ask questions on non-draft, non-ended listings
CREATE POLICY "Users can ask questions" ON auction_questions
    FOR INSERT WITH CHECK (
        auth.uid() = questioner_id
        AND EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id 
            AND status IN ('live', 'scheduled')
            AND auth.uid() != owner_id  -- Can't ask questions on own listing
        )
    );

-- Only listing owners can answer questions
CREATE POLICY "Listing owners can answer questions" ON auction_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_auction_questions_updated_at 
    BEFORE UPDATE ON auction_questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get unanswered question count for a listing
CREATE OR REPLACE FUNCTION get_unanswered_questions_count(listing_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM auction_questions 
        WHERE listing_id = listing_uuid AND answer IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
