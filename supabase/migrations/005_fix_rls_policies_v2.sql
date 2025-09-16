-- Fix RLS policies to prevent infinite recursion
-- This version handles existing policies properly

-- Drop ALL existing policies for profiles table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL existing policies for listings table  
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'listings' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON listings', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL existing policies for other tables
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('bids', 'watchlists', 'transactions', 'listing_images')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Create simplified, non-recursive policies for profiles
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create simplified listings policies
CREATE POLICY "listings_select_public" ON listings
    FOR SELECT USING (
        status IN ('live', 'ended', 'sold') 
        OR owner_id = auth.uid()
    );

CREATE POLICY "listings_insert_authenticated" ON listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "listings_update_owner" ON listings
    FOR UPDATE USING (
        auth.uid() = owner_id 
        AND status IN ('draft', 'scheduled')
    );

CREATE POLICY "listings_delete_draft" ON listings
    FOR DELETE USING (
        auth.uid() = owner_id 
        AND status = 'draft'
    );

-- Create policy for categories (public read)
CREATE POLICY "categories_select_all" ON categories
    FOR SELECT USING (true);

-- Create simplified bids policies
CREATE POLICY "bids_select_public" ON bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND status != 'draft'
        )
    );

CREATE POLICY "bids_insert_authenticated" ON bids
    FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Create watchlists policies
CREATE POLICY "watchlists_all_own" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Create transactions policies
CREATE POLICY "transactions_select_participants" ON transactions
    FOR SELECT USING (
        auth.uid() = buyer_id 
        OR EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );

-- Create listing_images policies
CREATE POLICY "listing_images_select_public" ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id 
            AND (status IN ('live', 'ended', 'sold') OR owner_id = auth.uid())
        )
    );

CREATE POLICY "listing_images_manage_owner" ON listing_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );
