-- Quick Apply Script for Q&A Email Notifications
-- Copy and paste this entire file into your Supabase SQL Editor and run it

-- This is the same as migration 041_question_email_notifications.sql
-- Use this if you can't run supabase db push

-- Migration: Add email notifications for Q&A feature
-- This migration adds support for email notifications when:
-- 1. A user asks a question on a listing (notify seller) - already exists
-- 2. A seller answers a question (notify questioner) - NEW

-- Step 1: Add 'question_answered' to the notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'question_received',
    'question_answered',
    'first_bid_received',
    'reserve_met',
    'listing_ended',
    'listing_reported',
    'bid_outbid',
    'auction_won',
    'time_warning_1h',
    'time_warning_2h',
    'time_warning_3h',
    'time_warning_6h',
    'time_warning_12h',
    'time_warning_24h',
    'time_warning_48h',
    'favorite_reserve_met',
    'favorite_ending_soon'
));

-- Step 2: Create function to notify questioner when their question is answered
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
        
        -- Get seller name from the listing owner
        SELECT COALESCE(p.full_name, p.username, 'The seller') INTO seller_name
        FROM listings l
        JOIN profiles p ON p.id = l.owner_id
        WHERE l.id = NEW.listing_id;
        
        -- Get questioner name
        SELECT COALESCE(full_name, username, 'User') INTO questioner_name
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

-- Step 3: Create trigger for question answered notifications
DROP TRIGGER IF EXISTS trigger_notify_question_answered ON auction_questions;

CREATE TRIGGER trigger_notify_question_answered
    AFTER UPDATE ON auction_questions
    FOR EACH ROW
    WHEN (OLD.answer IS DISTINCT FROM NEW.answer)
    EXECUTE FUNCTION notify_question_answered();

-- Step 4: Update notification preferences for existing users
-- Add question_received and question_answered preferences to all users who don't have them
UPDATE profiles
SET notification_preferences = notification_preferences || 
    jsonb_build_object(
        'question_received', true,
        'question_answered', true
    )
WHERE notification_preferences IS NOT NULL
    AND (
        notification_preferences->>'question_received' IS NULL
        OR notification_preferences->>'question_answered' IS NULL
    );

-- Step 5: Update the default notification preferences for new users
ALTER TABLE profiles ALTER COLUMN notification_preferences SET DEFAULT jsonb_build_object(
    'email_notifications', true,
    'question_received', true,
    'question_answered', true,
    'first_bid_received', true,
    'reserve_met', true,
    'listing_ended', true,
    'listing_reported', true,
    'bid_outbid', true,
    'auction_won', true,
    'time_warning_enabled', true,
    'time_warning_hours', 24,
    'favorite_notifications', true
);

-- Step 6: Update existing question_received trigger to include asker_name in metadata
-- Drop and recreate the function with updated metadata
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
    
    -- Get questioner name
    SELECT COALESCE(full_name, username, 'Someone') INTO questioner_name
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

-- Step 7: Add helpful comments for documentation
COMMENT ON FUNCTION notify_question_answered() IS 'Triggers email notification to user when seller answers their question';
COMMENT ON TRIGGER trigger_notify_question_answered ON auction_questions IS 'Sends notification when a question receives an answer';
COMMENT ON FUNCTION notify_question_received() IS 'Triggers email notification to seller when user asks a question';

-- Verification queries
SELECT '✅ Migration applied successfully!' as status;

-- Show that triggers are active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_question_received', 'trigger_notify_question_answered');

