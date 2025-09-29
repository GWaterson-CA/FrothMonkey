-- Migration: Auction Contact Exchange and Messaging System
-- This migration creates tables and functions for post-auction contact exchange

-- Create auction_contacts table
-- This table manages contact exchange between buyers and sellers
CREATE TABLE IF NOT EXISTS auction_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status of contact exchange
  -- 'pending_approval' - waiting for seller to approve (when reserve not met)
  -- 'approved' - seller approved, both parties can see contact info
  -- 'auto_approved' - auto-approved (reserve met or no reserve)
  -- 'declined' - seller declined contact exchange
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'auto_approved', 'declined')),
  
  -- Contact visibility flags
  seller_contact_visible BOOLEAN NOT NULL DEFAULT false,
  buyer_contact_visible BOOLEAN NOT NULL DEFAULT false,
  
  -- Reserve status at time of auction end
  reserve_met BOOLEAN NOT NULL DEFAULT false,
  final_price NUMERIC(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Ensure one contact exchange per auction
  UNIQUE(listing_id)
);

-- Create auction_messages table
-- Simple messaging system for sharing delivery details, phone numbers, etc.
CREATE TABLE IF NOT EXISTS auction_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES auction_contacts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL CHECK (LENGTH(message) <= 500),
  
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT valid_participants CHECK (
    sender_id != recipient_id
  )
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_auction_contacts_listing ON auction_contacts(listing_id);
CREATE INDEX IF NOT EXISTS idx_auction_contacts_seller ON auction_contacts(seller_id);
CREATE INDEX IF NOT EXISTS idx_auction_contacts_buyer ON auction_contacts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_auction_contacts_status ON auction_contacts(status);
CREATE INDEX IF NOT EXISTS idx_auction_messages_contact ON auction_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_auction_messages_sender ON auction_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_auction_messages_recipient ON auction_messages(recipient_id);

-- Enable RLS
ALTER TABLE auction_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auction_contacts
-- Buyers and sellers can see their own contact exchanges
CREATE POLICY "Users can view own contact exchanges" ON auction_contacts
  FOR SELECT USING (
    auth.uid() = seller_id OR auth.uid() = buyer_id
  );

-- Only system can create contact exchanges (via function)
CREATE POLICY "Service role can create contact exchanges" ON auction_contacts
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Sellers can update status to approve/decline
CREATE POLICY "Sellers can update contact exchange status" ON auction_contacts
  FOR UPDATE USING (
    auth.uid() = seller_id AND status = 'pending_approval'
  ) WITH CHECK (
    auth.uid() = seller_id AND status IN ('approved', 'declined')
  );

-- RLS Policies for auction_messages
-- Users can view messages in their contact exchanges
CREATE POLICY "Users can view own messages" ON auction_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Users can send messages in approved contact exchanges
CREATE POLICY "Users can send messages in approved exchanges" ON auction_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM auction_contacts
      WHERE id = contact_id
      AND (auth.uid() = seller_id OR auth.uid() = buyer_id)
      AND status IN ('approved', 'auto_approved')
    )
  );

-- Users can mark their own messages as read
CREATE POLICY "Users can update own received messages" ON auction_messages
  FOR UPDATE USING (
    auth.uid() = recipient_id
  );

-- Function to create contact exchange when auction ends
CREATE OR REPLACE FUNCTION create_contact_exchange(
  p_listing_id UUID,
  p_seller_id UUID,
  p_buyer_id UUID,
  p_final_price NUMERIC,
  p_reserve_met BOOLEAN
) RETURNS UUID AS $$
DECLARE
  contact_id UUID;
  exchange_status TEXT;
  seller_visible BOOLEAN;
  buyer_visible BOOLEAN;
BEGIN
  -- Determine status based on reserve
  IF p_reserve_met THEN
    exchange_status := 'auto_approved';
    seller_visible := true;
    buyer_visible := true;
  ELSE
    exchange_status := 'pending_approval';
    seller_visible := false;
    buyer_visible := false;
  END IF;

  -- Create contact exchange record
  INSERT INTO auction_contacts (
    listing_id,
    seller_id,
    buyer_id,
    status,
    seller_contact_visible,
    buyer_contact_visible,
    reserve_met,
    final_price,
    approved_at
  ) VALUES (
    p_listing_id,
    p_seller_id,
    p_buyer_id,
    exchange_status,
    seller_visible,
    buyer_visible,
    p_reserve_met,
    p_final_price,
    CASE WHEN p_reserve_met THEN NOW() ELSE NULL END
  )
  RETURNING id INTO contact_id;

  -- Create notifications
  IF p_reserve_met THEN
    -- Notify both parties that contacts are shared
    PERFORM create_notification(
      p_seller_id,
      'contact_shared',
      'Contact Details Shared',
      'Your auction ended successfully. Contact details have been shared with the buyer.',
      p_listing_id,
      p_buyer_id,
      jsonb_build_object('contact_id', contact_id)
    );

    PERFORM create_notification(
      p_buyer_id,
      'contact_shared',
      'Contact Details Shared',
      'Congratulations! Contact details have been shared with the seller.',
      p_listing_id,
      p_seller_id,
      jsonb_build_object('contact_id', contact_id)
    );
  ELSE
    -- Notify seller to approve/decline contact exchange
    PERFORM create_notification(
      p_seller_id,
      'contact_approval_needed',
      'Contact Exchange Request',
      'Your auction ended without meeting reserve. Would you like to connect with the highest bidder?',
      p_listing_id,
      p_buyer_id,
      jsonb_build_object('contact_id', contact_id)
    );
  END IF;

  RETURN contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve contact exchange
CREATE OR REPLACE FUNCTION approve_contact_exchange(
  p_contact_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  contact_record RECORD;
BEGIN
  -- Get contact exchange details
  SELECT * INTO contact_record
  FROM auction_contacts
  WHERE id = p_contact_id
  AND seller_id = auth.uid()
  AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact exchange not found or already processed';
  END IF;

  -- Update status
  UPDATE auction_contacts
  SET 
    status = 'approved',
    seller_contact_visible = true,
    buyer_contact_visible = true,
    approved_at = NOW()
  WHERE id = p_contact_id;

  -- Notify buyer that seller approved
  PERFORM create_notification(
    contact_record.buyer_id,
    'contact_approved',
    'Contact Exchange Approved',
    'The seller has approved the contact exchange. You can now message each other.',
    contact_record.listing_id,
    contact_record.seller_id,
    jsonb_build_object('contact_id', p_contact_id)
  );

  -- Notify seller
  PERFORM create_notification(
    contact_record.seller_id,
    'contact_approved',
    'Contact Exchange Approved',
    'You approved the contact exchange. You can now message the buyer.',
    contact_record.listing_id,
    contact_record.buyer_id,
    jsonb_build_object('contact_id', p_contact_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline contact exchange
CREATE OR REPLACE FUNCTION decline_contact_exchange(
  p_contact_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  contact_record RECORD;
BEGIN
  -- Get contact exchange details
  SELECT * INTO contact_record
  FROM auction_contacts
  WHERE id = p_contact_id
  AND seller_id = auth.uid()
  AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact exchange not found or already processed';
  END IF;

  -- Update status
  UPDATE auction_contacts
  SET 
    status = 'declined',
    declined_at = NOW()
  WHERE id = p_contact_id;

  -- Notify buyer that seller declined
  PERFORM create_notification(
    contact_record.buyer_id,
    'contact_declined',
    'Contact Exchange Declined',
    'The seller has declined the contact exchange for this auction.',
    contact_record.listing_id,
    contact_record.seller_id,
    jsonb_build_object('contact_id', p_contact_id)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update finalize_auctions function to create contact exchanges
CREATE OR REPLACE FUNCTION finalize_auctions(batch_limit INTEGER DEFAULT 200)
RETURNS INTEGER AS $$
DECLARE
    finalized_count INTEGER := 0;
    listing_record RECORD;
    highest_bid RECORD;
    contact_id UUID;
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
                
                -- Create auto-approved contact exchange (reserve met)
                SELECT create_contact_exchange(
                    listing_record.id,
                    listing_record.owner_id,
                    highest_bid.bidder_id,
                    highest_bid.amount,
                    true  -- reserve_met
                ) INTO contact_id;
            ELSE
                -- Reserve not met, mark as ended
                UPDATE listings 
                SET status = 'ended', updated_at = NOW()
                WHERE id = listing_record.id;
                
                -- Create pending contact exchange (needs seller approval)
                SELECT create_contact_exchange(
                    listing_record.id,
                    listing_record.owner_id,
                    highest_bid.bidder_id,
                    highest_bid.amount,
                    false  -- reserve_not_met
                ) INTO contact_id;
            END IF;
        END IF;
        
        finalized_count := finalized_count + 1;
    END LOOP;
    
    RETURN finalized_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON auction_contacts TO authenticated;
GRANT SELECT ON auction_messages TO authenticated;
GRANT INSERT ON auction_messages TO authenticated;
GRANT UPDATE ON auction_messages TO authenticated;
