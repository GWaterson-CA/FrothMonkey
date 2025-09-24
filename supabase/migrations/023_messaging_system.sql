-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, seller_id, buyer_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        auth.uid() = seller_id OR auth.uid() = buyer_id
    );

CREATE POLICY "Users can create conversations for their listings or as buyers" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = seller_id OR auth.uid() = buyer_id
    );

-- RLS policies for messages
CREATE POLICY "Users can view messages in conversations they participate in" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.seller_id = auth.uid() OR conversations.buyer_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in conversations they participate in" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.seller_id = auth.uid() OR conversations.buyer_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Function to create or get conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    listing_uuid UUID,
    participant_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_uuid UUID;
    listing_record RECORD;
BEGIN
    -- Get listing details
    SELECT owner_id INTO listing_record
    FROM listings 
    WHERE id = listing_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found: %', listing_uuid;
    END IF;
    
    -- Check if user is trying to message themselves
    IF listing_record.owner_id = participant_uuid THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO conversation_uuid
    FROM conversations
    WHERE listing_id = listing_uuid 
    AND (
        (seller_id = listing_record.owner_id AND buyer_id = participant_uuid) OR
        (seller_id = participant_uuid AND buyer_id = listing_record.owner_id)
    );
    
    -- If no conversation exists, create one
    IF conversation_uuid IS NULL THEN
        INSERT INTO conversations (listing_id, seller_id, buyer_id)
        VALUES (listing_uuid, listing_record.owner_id, participant_uuid)
        RETURNING id INTO conversation_uuid;
    END IF;
    
    RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(conversation_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    is_seller BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.seller_id as user_id,
        p.username,
        TRUE as is_seller
    FROM conversations c
    JOIN profiles p ON p.id = c.seller_id
    WHERE c.id = conversation_uuid
    
    UNION ALL
    
    SELECT 
        c.buyer_id as user_id,
        p.username,
        FALSE as is_seller
    FROM conversations c
    JOIN profiles p ON p.id = c.buyer_id
    WHERE c.id = conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;
