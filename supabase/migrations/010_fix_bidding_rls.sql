-- Fix RLS policies to allow bidding on live auctions
-- The place_bid function needs to be able to lock and update listings for bidding

-- Allow authenticated users to "update" listings for the bidding process
-- This is specifically for the place_bid function which uses SELECT...FOR UPDATE and UPDATE
CREATE POLICY "listings_bidding_update" ON listings
    FOR UPDATE USING (
        status = 'live' 
        AND NOW() >= start_time 
        AND NOW() <= end_time
        AND auth.uid() != owner_id  -- Don't allow owners to bid on their own listings
        AND auth.uid() IS NOT NULL  -- Must be authenticated
    )
    WITH CHECK (
        status IN ('live', 'sold')  -- Allow status updates to 'sold' for buy-now
        AND auth.uid() IS NOT NULL  -- Must be authenticated
    );

-- Also ensure the place_bid function can access the listing data
-- by allowing SELECT with FOR UPDATE for authenticated users on live listings
CREATE POLICY "listings_bidding_select" ON listings
    FOR SELECT USING (
        status IN ('live', 'ended', 'sold', 'scheduled') 
        OR owner_id = auth.uid()
        OR (auth.uid() IS NOT NULL AND status = 'live')  -- Allow authenticated users to read live listings for bidding
    );

-- Drop the old policy and replace it
DROP POLICY IF EXISTS "listings_public_read" ON listings;
