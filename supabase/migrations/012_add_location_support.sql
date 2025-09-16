-- Add location support to listings and create location interest tracking

-- Add location field to listings table
ALTER TABLE listings ADD COLUMN location TEXT NOT NULL DEFAULT 'Squamish, BC';

-- Create index for location-based queries
CREATE INDEX idx_listings_location_status ON listings(location, status);

-- Create location interest table for collecting interest from users outside current service areas
CREATE TABLE location_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Allow anonymous interest
    email TEXT,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we don't have duplicates from the same user for the same location
    UNIQUE(user_id, location),
    
    -- For anonymous users, ensure no duplicate emails for same location
    UNIQUE(email, location)
);

-- Create indexes for location interest
CREATE INDEX idx_location_interest_location ON location_interest(location, created_at DESC);
CREATE INDEX idx_location_interest_user ON location_interest(user_id);

-- Enable Row Level Security for location interest
ALTER TABLE location_interest ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_interest

-- Anyone can view location interest counts (for admin dashboard)
CREATE POLICY "Public can view location interest" ON location_interest
    FOR SELECT USING (true);

-- Anyone can submit location interest (both authenticated and anonymous users)
CREATE POLICY "Anyone can submit location interest" ON location_interest
    FOR INSERT WITH CHECK (true);

-- Users can update their own location interest
CREATE POLICY "Users can update own location interest" ON location_interest
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own location interest
CREATE POLICY "Users can delete own location interest" ON location_interest
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_location_interest_updated_at 
    BEFORE UPDATE ON location_interest
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
