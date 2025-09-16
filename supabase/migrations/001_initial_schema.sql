-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE auction_status AS ENUM ('draft', 'scheduled', 'live', 'ended', 'cancelled', 'sold');
CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'parts');

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT UNIQUE CHECK (char_length(username) BETWEEN 3 AND 24),
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
);

-- Create listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title TEXT NOT NULL,
    description TEXT,
    condition item_condition NOT NULL DEFAULT 'good',
    start_price NUMERIC(12,2) NOT NULL CHECK (start_price >= 0),
    reserve_price NUMERIC(12,2) NULL,
    buy_now_price NUMERIC(12,2) NULL,
    current_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    anti_sniping_seconds INTEGER NOT NULL DEFAULT 30,
    status auction_status NOT NULL DEFAULT 'draft',
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reserve_met BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN reserve_price IS NULL THEN TRUE 
            WHEN current_price >= reserve_price THEN TRUE 
            ELSE FALSE 
        END
    ) STORED,
    buy_now_enabled BOOLEAN GENERATED ALWAYS AS (buy_now_price IS NOT NULL) STORED
);

-- Create indexes for listings
CREATE INDEX idx_listings_status_end_time ON listings(status, end_time);
CREATE INDEX idx_listings_category_status ON listings(category_id, status);
CREATE INDEX idx_listings_owner_status ON listings(owner_id, status);
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create listing_images table
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Create bids table
CREATE TABLE bids (
    id BIGSERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for bids
CREATE INDEX idx_bids_listing_created ON bids(listing_id, created_at DESC);

-- Create watchlists table
CREATE TABLE watchlists (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    final_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending'
);

-- Helper function: Calculate minimum bid increment
CREATE OR REPLACE FUNCTION min_bid_increment(amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    CASE 
        WHEN amount < 100 THEN RETURN 1;
        WHEN amount < 1000 THEN RETURN 5;
        ELSE RETURN 10;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function: Calculate next minimum bid
CREATE OR REPLACE FUNCTION next_min_bid(listing_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    listing_record RECORD;
BEGIN
    SELECT current_price, start_price INTO listing_record
    FROM listings WHERE id = listing_id;
    
    RETURN GREATEST(listing_record.current_price, listing_record.start_price) + 
           min_bid_increment(GREATEST(listing_record.current_price, listing_record.start_price));
END;
$$ LANGUAGE plpgsql;

-- Main bidding function
CREATE OR REPLACE FUNCTION place_bid(
    listing_id UUID,
    bid_amount NUMERIC,
    bidder UUID
)
RETURNS JSONB AS $$
DECLARE
    listing_record RECORD;
    required_min NUMERIC;
    result JSONB;
BEGIN
    -- Lock the listing row for update
    SELECT * INTO listing_record
    FROM listings 
    WHERE id = listing_id
    FOR UPDATE;
    
    -- Check if listing exists and is live
    IF NOT FOUND THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Listing not found');
    END IF;
    
    IF listing_record.status != 'live' THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Auction is not live');
    END IF;
    
    IF NOW() < listing_record.start_time OR NOW() > listing_record.end_time THEN
        RETURN jsonb_build_object('accepted', false, 'reason', 'Auction is not active');
    END IF;
    
    -- Calculate required minimum bid
    required_min := next_min_bid(listing_id);
    
    -- Handle Buy Now scenario
    IF listing_record.buy_now_enabled AND bid_amount >= listing_record.buy_now_price THEN
        -- Insert bid at buy now price
        INSERT INTO bids (listing_id, bidder_id, amount)
        VALUES (listing_id, bidder, listing_record.buy_now_price);
        
        -- Update listing
        UPDATE listings 
        SET current_price = listing_record.buy_now_price,
            status = 'sold',
            updated_at = NOW()
        WHERE id = listing_id;
        
        -- Create transaction
        INSERT INTO transactions (listing_id, buyer_id, final_price)
        VALUES (listing_id, bidder, listing_record.buy_now_price);
        
        RETURN jsonb_build_object(
            'accepted', true,
            'buy_now', true,
            'new_highest', listing_record.buy_now_price,
            'end_time', listing_record.end_time
        );
    END IF;
    
    -- Regular bid validation
    IF bid_amount < required_min THEN
        RETURN jsonb_build_object(
            'accepted', false, 
            'reason', 'Bid amount too low',
            'minimum_required', required_min
        );
    END IF;
    
    -- Insert the bid
    INSERT INTO bids (listing_id, bidder_id, amount)
    VALUES (listing_id, bidder, bid_amount);
    
    -- Update current price
    UPDATE listings 
    SET current_price = bid_amount,
        updated_at = NOW()
    WHERE id = listing_id;
    
    -- Anti-sniping: extend end time if bid is placed in final seconds
    IF listing_record.end_time - NOW() <= make_interval(secs := listing_record.anti_sniping_seconds) THEN
        UPDATE listings 
        SET end_time = end_time + INTERVAL '2 minutes'
        WHERE id = listing_id;
        
        -- Get updated end time
        SELECT end_time INTO listing_record.end_time
        FROM listings WHERE id = listing_id;
    END IF;
    
    RETURN jsonb_build_object(
        'accepted', true,
        'new_highest', bid_amount,
        'end_time', listing_record.end_time
    );
END;
$$ LANGUAGE plpgsql;

-- Function to finalize auctions
CREATE OR REPLACE FUNCTION finalize_auctions(batch_limit INTEGER DEFAULT 200)
RETURNS INTEGER AS $$
DECLARE
    finalized_count INTEGER := 0;
    listing_record RECORD;
    highest_bid RECORD;
BEGIN
    -- Find auctions that need to be finalized
    FOR listing_record IN 
        SELECT id, owner_id, current_price, reserve_met, buy_now_enabled
        FROM listings 
        WHERE status = 'live' 
          AND NOW() >= end_time
        LIMIT batch_limit
    LOOP
        -- Find highest bid for this listing
        SELECT bidder_id, amount INTO highest_bid
        FROM bids 
        WHERE listing_id = listing_record.id
        ORDER BY amount DESC, created_at ASC
        LIMIT 1;
        
        IF NOT FOUND THEN
            -- No bids, mark as ended
            UPDATE listings 
            SET status = 'ended', updated_at = NOW()
            WHERE id = listing_record.id;
        ELSE
            -- Check if reserve is met or buy now was disabled
            IF listing_record.reserve_met OR NOT listing_record.buy_now_enabled THEN
                -- Mark as sold and create transaction
                UPDATE listings 
                SET status = 'sold', updated_at = NOW()
                WHERE id = listing_record.id;
                
                INSERT INTO transactions (listing_id, buyer_id, final_price)
                VALUES (listing_record.id, highest_bid.bidder_id, highest_bid.amount);
            ELSE
                -- Reserve not met, mark as ended
                UPDATE listings 
                SET status = 'ended', updated_at = NOW()
                WHERE id = listing_record.id;
            END IF;
        END IF;
        
        finalized_count := finalized_count + 1;
    END LOOP;
    
    RETURN finalized_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for listings
CREATE POLICY "Public can view live/ended/sold listings" ON listings
    FOR SELECT USING (
        status IN ('live', 'ended', 'sold') OR owner_id = auth.uid()
    );

CREATE POLICY "Users can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update draft/scheduled listings" ON listings
    FOR UPDATE USING (
        (auth.uid() = owner_id AND status IN ('draft', 'scheduled'))
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Owners can delete draft listings" ON listings
    FOR DELETE USING (
        auth.uid() = owner_id AND status = 'draft'
    );

-- RLS Policies for listing_images
CREATE POLICY "Public can view images for visible listings" ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id 
            AND (status IN ('live', 'ended', 'sold') OR owner_id = auth.uid())
        )
    );

CREATE POLICY "Listing owners can manage images" ON listing_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
    );

-- RLS Policies for bids
CREATE POLICY "Public can view bids for non-draft listings" ON bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND status != 'draft'
        )
    );

CREATE POLICY "Authenticated users can place bids" ON bids
    FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- RLS Policies for watchlists
CREATE POLICY "Users can manage own watchlist" ON watchlists
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Buyers and sellers can view transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = buyer_id 
        OR EXISTS (
            SELECT 1 FROM listings 
            WHERE id = listing_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Seed categories
INSERT INTO categories (name, slug, sort_order) VALUES
    ('Kids Toys', 'kids-toys', 1),
    ('Bikes', 'bikes', 2),
    ('Home & Garden', 'home-and-garden', 3),
    ('Vehicles', 'vehicles', 4);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for listings
CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
