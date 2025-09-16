-- Fix RLS policies to prevent infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simplified, non-recursive policies for profiles
CREATE POLICY "Enable read access for own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix the listings policies to avoid recursion
DROP POLICY IF EXISTS "Public can view live/ended/sold listings" ON listings;
DROP POLICY IF EXISTS "Users can insert own listings" ON listings;
DROP POLICY IF EXISTS "Owners can update draft/scheduled listings" ON listings;
DROP POLICY IF EXISTS "Owners can delete draft listings" ON listings;

-- Create simplified listings policies
CREATE POLICY "Enable read for public listings" ON listings
    FOR SELECT USING (
        status IN ('live', 'ended', 'sold') 
        OR owner_id = auth.uid()
    );

CREATE POLICY "Enable insert for authenticated users" ON listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable update for listing owners" ON listings
    FOR UPDATE USING (
        auth.uid() = owner_id 
        AND status IN ('draft', 'scheduled')
    );

CREATE POLICY "Enable delete for draft listings" ON listings
    FOR DELETE USING (
        auth.uid() = owner_id 
        AND status = 'draft'
    );

-- Ensure categories table allows public read access
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Enable read access for categories" ON categories
    FOR SELECT USING (true);

-- Fix other table policies that might cause issues
DROP POLICY IF EXISTS "Public can view bids for non-draft listings" ON bids;
CREATE POLICY "Enable read for public bids" ON bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND status != 'draft'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can place bids" ON bids;
CREATE POLICY "Enable insert for authenticated bidders" ON bids
    FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Fix watchlists policies
DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlists;
CREATE POLICY "Enable all for own watchlist" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Fix transactions policies
DROP POLICY IF EXISTS "Buyers and sellers can view transactions" ON transactions;
CREATE POLICY "Enable read for transaction participants" ON transactions
    FOR SELECT USING (
        auth.uid() = buyer_id 
        OR EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );
