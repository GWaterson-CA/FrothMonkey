-- Fix Q&A Email Privacy: Use usernames instead of real names
-- This updates the notification functions to show usernames for anonymity

SELECT '🔒 FIXING Q&A EMAIL PRIVACY' as status;
SELECT 'Updating functions to use usernames instead of real names...' as info;

-- Update notify_question_received function to use username first
CREATE OR REPLACE FUNCTION notify_question_received()
RETURNS TRIGGER AS $$
DECLARE
    listing_owner UUID;
    listing_title TEXT;
    questioner_name TEXT;
BEGIN
    -- Get listing owner and title
    SELECT owner_id, title INTO listing_owner, listing_title
    FROM listings WHERE id = NEW.listing_id;
    
    -- Get questioner name - USERNAME ONLY for privacy
    SELECT COALESCE(username, 'Anonymous') INTO questioner_name
    FROM profiles WHERE id = NEW.questioner_id;
    
    -- Create notification for seller
    PERFORM create_notification(
        listing_owner,
        'question_received',
        'New Question on Your Listing',
        questioner_name || ' asked a question about "' || listing_title || '"',
        NEW.listing_id,
        NEW.questioner_id,
        jsonb_build_object(
            'question_id', NEW.id,
            'question', NEW.question,
            'asker_name', questioner_name
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update notify_question_answered function to use username first
CREATE OR REPLACE FUNCTION notify_question_answered()
RETURNS TRIGGER AS $$
DECLARE
    listing_title TEXT;
    seller_name TEXT;
    questioner_name TEXT;
BEGIN
    -- Only proceed if answer was just added (wasn't there before but is now)
    IF OLD.answer IS NULL AND NEW.answer IS NOT NULL THEN
        -- Get listing title
        SELECT title INTO listing_title
        FROM listings WHERE id = NEW.listing_id;
        
        -- Get seller name from the listing owner - USERNAME ONLY for privacy
        SELECT COALESCE(p.username, 'Seller') INTO seller_name
        FROM listings l
        JOIN profiles p ON p.id = l.owner_id
        WHERE l.id = NEW.listing_id;
        
        -- Get questioner name - USERNAME ONLY for privacy
        SELECT COALESCE(username, 'Anonymous') INTO questioner_name
        FROM profiles WHERE id = NEW.questioner_id;
        
        -- Create notification for the person who asked the question
        PERFORM create_notification(
            NEW.questioner_id,
            'question_answered',
            'Your Question Was Answered',
            seller_name || ' answered your question about "' || listing_title || '"',
            NEW.listing_id,
            (SELECT owner_id FROM listings WHERE id = NEW.listing_id),
            jsonb_build_object(
                'question_id', NEW.id,
                'question', NEW.question,
                'answer', NEW.answer,
                'seller_name', seller_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update comments to reflect privacy change
COMMENT ON FUNCTION notify_question_received() IS 'Triggers email notification to seller when user asks a question (uses username for privacy)';
COMMENT ON FUNCTION notify_question_answered() IS 'Triggers email notification to user when seller answers their question (uses username for privacy)';

SELECT '✅ Functions updated successfully!' as status;
SELECT 'Now using usernames ONLY (never full names) for privacy' as result;
SELECT 'Both question askers and sellers will show as usernames only in emails and UI' as note;
