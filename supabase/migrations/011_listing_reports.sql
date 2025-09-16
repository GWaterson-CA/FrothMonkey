-- Create listing reports table for content moderation
CREATE TABLE listing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'misleading_info', 'copyright_violation', 'counterfeit', 'spam', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reports from same user for same listing
    UNIQUE(listing_id, reporter_id)
);

-- Create indexes
CREATE INDEX idx_listing_reports_listing ON listing_reports(listing_id);
CREATE INDEX idx_listing_reports_reporter ON listing_reports(reporter_id);
CREATE INDEX idx_listing_reports_status ON listing_reports(status, created_at DESC);

-- Enable Row Level Security
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_reports

-- Reporters can view their own reports
CREATE POLICY "Users can view own reports" ON listing_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports" ON listing_reports
    FOR INSERT WITH CHECK (
        auth.uid() = reporter_id
        AND auth.uid() IS NOT NULL
    );

-- Create trigger for updated_at
CREATE TRIGGER update_listing_reports_updated_at 
    BEFORE UPDATE ON listing_reports
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
