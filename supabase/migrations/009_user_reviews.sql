-- Create user reviews table
CREATE TABLE user_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one review per transaction per direction
    UNIQUE(transaction_id, reviewer_id, reviewee_id)
);

-- Create indexes
CREATE INDEX idx_user_reviews_reviewee ON user_reviews(reviewee_id, created_at DESC);
CREATE INDEX idx_user_reviews_transaction ON user_reviews(transaction_id);
CREATE INDEX idx_user_reviews_reviewer ON user_reviews(reviewer_id);

-- Enable Row Level Security
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reviews

-- Anyone can view reviews (they are public)
CREATE POLICY "Public can view reviews" ON user_reviews
    FOR SELECT USING (true);

-- Only transaction participants can create reviews
CREATE POLICY "Transaction participants can create reviews" ON user_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM transactions t
            JOIN listings l ON l.id = t.listing_id
            WHERE t.id = transaction_id 
            AND (
                (t.buyer_id = auth.uid() AND l.owner_id = reviewee_id) OR
                (l.owner_id = auth.uid() AND t.buyer_id = reviewee_id)
            )
            AND t.status = 'pending' -- Only allow reviews on completed transactions
        )
    );

-- Reviewers can update their own reviews
CREATE POLICY "Reviewers can update own reviews" ON user_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_reviews_updated_at 
    BEFORE UPDATE ON user_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's average rating
CREATE OR REPLACE FUNCTION get_user_rating(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    avg_rating NUMERIC;
    review_count INTEGER;
    result JSONB;
BEGIN
    SELECT 
        ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
        COUNT(*)::INTEGER as review_count
    INTO avg_rating, review_count
    FROM user_reviews 
    WHERE reviewee_id = user_uuid;
    
    -- Return null if no reviews
    IF review_count = 0 THEN
        RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'average_rating', avg_rating,
        'review_count', review_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review another user for a transaction
CREATE OR REPLACE FUNCTION can_review_user(transaction_uuid UUID, reviewer_uuid UUID, reviewee_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM transactions t
        JOIN listings l ON l.id = t.listing_id
        WHERE t.id = transaction_uuid
        AND t.status = 'pending'
        AND (
            (t.buyer_id = reviewer_uuid AND l.owner_id = reviewee_uuid) OR
            (l.owner_id = reviewer_uuid AND t.buyer_id = reviewee_uuid)
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_reviews
            WHERE transaction_id = transaction_uuid
            AND reviewer_id = reviewer_uuid
            AND reviewee_id = reviewee_uuid
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
