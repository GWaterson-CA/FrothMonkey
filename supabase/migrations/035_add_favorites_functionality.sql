-- Add favorite count to listings
-- This will help us efficiently display the number of users who have favorited each listing

-- Add a computed column for favorite count
ALTER TABLE listings ADD COLUMN IF NOT EXISTS favorite_count integer DEFAULT 0;

-- Function to update favorite count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE listings
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE listings
    SET favorite_count = GREATEST(0, favorite_count - 1)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update favorite count
DROP TRIGGER IF EXISTS update_listing_favorite_count ON watchlists;
CREATE TRIGGER update_listing_favorite_count
  AFTER INSERT OR DELETE ON watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();

-- Initialize favorite counts for existing listings
UPDATE listings
SET favorite_count = (
  SELECT COUNT(*)
  FROM watchlists
  WHERE watchlists.listing_id = listings.id
);

-- Create index on watchlists for better performance
CREATE INDEX IF NOT EXISTS idx_watchlists_listing_user ON watchlists(listing_id, user_id);

-- Function to check and send favorite notifications
-- This will be called by a scheduled job to notify users when:
-- 1. A favorited listing's reserve is met
-- 2. A favorited listing has less than 24 hours remaining

CREATE OR REPLACE FUNCTION create_favorite_notifications()
RETURNS integer AS $$
DECLARE
  notification_count integer := 0;
  listing_record RECORD;
  watchlist_record RECORD;
BEGIN
  -- Check for favorited listings that just met their reserve
  FOR listing_record IN
    SELECT 
      l.id,
      l.title,
      l.reserve_met,
      l.end_time,
      l.status,
      l.current_price
    FROM listings l
    WHERE l.status = 'live'
      AND l.reserve_met = true
      AND l.end_time > NOW()
      -- Only listings that met reserve in the last hour
      AND NOT EXISTS (
        SELECT 1 
        FROM notifications n 
        WHERE n.listing_id = l.id 
          AND n.type = 'favorite_reserve_met'
          AND n.created_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    -- Create notifications for all users who favorited this listing
    FOR watchlist_record IN
      SELECT user_id
      FROM watchlists
      WHERE listing_id = listing_record.id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        listing_id,
        metadata
      ) VALUES (
        watchlist_record.user_id,
        'favorite_reserve_met',
        'Reserve Met on Favorited Listing',
        'The reserve price has been met on "' || listing_record.title || '"!',
        listing_record.id,
        jsonb_build_object(
          'listing_title', listing_record.title,
          'current_price', listing_record.current_price,
          'end_time', listing_record.end_time
        )
      );
      notification_count := notification_count + 1;
    END LOOP;
  END LOOP;

  -- Check for favorited listings ending in less than 24 hours
  FOR listing_record IN
    SELECT 
      l.id,
      l.title,
      l.reserve_met,
      l.end_time,
      l.status,
      l.current_price
    FROM listings l
    WHERE l.status = 'live'
      AND l.end_time > NOW()
      AND l.end_time <= NOW() + INTERVAL '24 hours'
      -- Only send once per listing
      AND NOT EXISTS (
        SELECT 1 
        FROM notifications n 
        WHERE n.listing_id = l.id 
          AND n.type = 'favorite_ending_soon'
      )
  LOOP
    -- Create notifications for all users who favorited this listing
    FOR watchlist_record IN
      SELECT user_id
      FROM watchlists
      WHERE listing_id = listing_record.id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        listing_id,
        metadata
      ) VALUES (
        watchlist_record.user_id,
        'favorite_ending_soon',
        'Favorited Listing Ending Soon',
        '"' || listing_record.title || '" ends in less than 24 hours!',
        listing_record.id,
        jsonb_build_object(
          'listing_title', listing_record.title,
          'current_price', listing_record.current_price,
          'end_time', listing_record.end_time,
          'reserve_met', listing_record.reserve_met
        )
      );
      notification_count := notification_count + 1;
    END LOOP;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_favorite_notifications() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_favorite_notifications() IS 'Creates notifications for favorited listings when reserve is met or ending soon. Should be run hourly.';

