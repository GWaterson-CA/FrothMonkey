-- Simple RLS policy fix - disable and recreate cleanly
-- First, disable RLS temporarily to clear all policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (this clears all existing policies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies

-- Profiles: users can manage their own profile
CREATE POLICY "profiles_own_access" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Listings: public read for live auctions, owners can manage their own
CREATE POLICY "listings_public_read" ON listings
    FOR SELECT USING (
        status IN ('live', 'ended', 'sold') OR owner_id = auth.uid()
    );

CREATE POLICY "listings_owner_write" ON listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "listings_owner_update" ON listings
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "listings_owner_delete" ON listings
    FOR DELETE USING (auth.uid() = owner_id AND status = 'draft');

-- Categories: public read access
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT USING (true);

-- Bids: public read for non-draft listings, authenticated users can bid
CREATE POLICY "bids_public_read" ON bids
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND status != 'draft')
    );

CREATE POLICY "bids_authenticated_insert" ON bids
    FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Listing images: follow listing visibility rules
CREATE POLICY "listing_images_read" ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id 
            AND (status IN ('live', 'ended', 'sold') OR owner_id = auth.uid())
        )
    );

CREATE POLICY "listing_images_owner_manage" ON listing_images
    FOR ALL USING (
        EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
    );

-- Watchlists: users manage their own
CREATE POLICY "watchlists_own_access" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Transactions: participants can view
CREATE POLICY "transactions_participant_read" ON transactions
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
    );
