-- Migration: Email Notifications Setup
-- This migration updates the notification system to support email notifications

-- Update the create_time_warning_notifications function to support custom user timeframes
CREATE OR REPLACE FUNCTION create_time_warning_notifications()
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    listing RECORD;
    bidder RECORD;
    bidder_name TEXT;
    time_remaining INTERVAL;
    hours_remaining NUMERIC;
    notification_type TEXT;
    user_pref_hours INTEGER;
BEGIN
    -- Find all live listings
    FOR listing IN
        SELECT id, title, owner_id, end_time, current_price
        FROM listings
        WHERE status = 'live'
          AND end_time > NOW()
          AND end_time <= NOW() + INTERVAL '48 hours'
    LOOP
        time_remaining := listing.end_time - NOW();
        hours_remaining := EXTRACT(EPOCH FROM time_remaining) / 3600;
        
        -- Get all distinct bidders for this listing (excluding the owner)
        FOR bidder IN
            SELECT DISTINCT ON (b.bidder_id) 
                b.bidder_id,
                p.notification_preferences
            FROM bids b
            JOIN profiles p ON p.id = b.bidder_id
            WHERE b.listing_id = listing.id
              AND b.bidder_id != listing.owner_id
        LOOP
            -- Get user's preferred warning timeframe (default to 24h)
            user_pref_hours := COALESCE(
                (bidder.notification_preferences->>'time_warning_hours')::INTEGER,
                24
            );
            
            -- Check if time_warning is enabled for this user
            IF COALESCE((bidder.notification_preferences->>'time_warning_enabled')::BOOLEAN, true) THEN
                -- Check if we should notify based on user's preference
                -- Only notify if within the timeframe window (±30 minutes of the exact time)
                IF hours_remaining <= user_pref_hours 
                   AND hours_remaining >= (user_pref_hours - 0.5) THEN
                    
                    -- Determine notification type based on hours
                    notification_type := 'time_warning_' || user_pref_hours || 'h';
                    
                    -- Check if user already received this notification for this listing
                    IF NOT EXISTS (
                        SELECT 1 FROM notifications
                        WHERE user_id = bidder.bidder_id
                          AND listing_id = listing.id
                          AND type = notification_type
                    ) THEN
                        -- Check if user is currently the highest bidder
                        DECLARE
                            is_leading BOOLEAN;
                        BEGIN
                            SELECT (b.bidder_id = bidder.bidder_id) INTO is_leading
                            FROM bids b
                            WHERE b.listing_id = listing.id
                            ORDER BY b.amount DESC, b.created_at ASC
                            LIMIT 1;
                            
                            -- Create notification
                            PERFORM create_notification(
                                bidder.bidder_id,
                                notification_type,
                                user_pref_hours || ' Hour' || CASE WHEN user_pref_hours != 1 THEN 's' ELSE '' END || ' Left!',
                                'The auction for "' || listing.title || '" ends in ' || user_pref_hours || ' hour' || CASE WHEN user_pref_hours != 1 THEN 's' ELSE '' END,
                                listing.id,
                                NULL,
                                jsonb_build_object(
                                    'hours_remaining', user_pref_hours,
                                    'current_bid', listing.current_price,
                                    'is_leading_bidder', COALESCE(is_leading, false)
                                )
                            );
                            
                            notification_count := notification_count + 1;
                        END;
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle auction finalization notifications with emails
CREATE OR REPLACE FUNCTION notify_auction_ended()
RETURNS TRIGGER AS $$
DECLARE
    listing_title TEXT;
    highest_bid RECORD;
    buyer_name TEXT;
    seller_name TEXT;
    had_bids BOOLEAN;
BEGIN
    -- Only process when status changes to 'ended' or 'sold'
    IF NEW.status IN ('ended', 'sold') AND OLD.status != NEW.status THEN
        
        SELECT title INTO listing_title FROM listings WHERE id = NEW.id;
        
        -- Check if there were any bids
        SELECT COUNT(*) > 0 INTO had_bids
        FROM bids WHERE listing_id = NEW.id;
        
        IF had_bids THEN
            -- Get highest bid info
            SELECT b.bidder_id, b.amount, COALESCE(p.full_name, p.username, 'A buyer') as name
            INTO highest_bid
            FROM bids b
            JOIN profiles p ON p.id = b.bidder_id
            WHERE b.listing_id = NEW.id
            ORDER BY b.amount DESC, b.created_at ASC
            LIMIT 1;
            
            buyer_name := highest_bid.name;
            
            -- Get seller name
            SELECT COALESCE(p.full_name, p.username, 'The seller') INTO seller_name
            FROM profiles p WHERE p.id = NEW.owner_id;
            
            -- Notify seller
            PERFORM create_notification(
                NEW.owner_id,
                'listing_ended_seller',
                CASE 
                    WHEN NEW.status = 'sold' THEN 'Your Auction Sold!'
                    ELSE 'Your Auction Ended'
                END,
                CASE 
                    WHEN NEW.status = 'sold' THEN 
                        'Your auction for "' || listing_title || '" sold for $' || highest_bid.amount || ' to ' || buyer_name
                    ELSE 
                        'Your auction for "' || listing_title || '" ended with a high bid of $' || highest_bid.amount
                END,
                NEW.id,
                highest_bid.bidder_id,
                jsonb_build_object(
                    'final_bid', highest_bid.amount,
                    'reserve_met', NEW.reserve_met,
                    'buyer_name', buyer_name,
                    'had_bids', true
                )
            );
            
            -- Notify winner if auction sold
            IF NEW.status = 'sold' THEN
                PERFORM create_notification(
                    highest_bid.bidder_id,
                    'auction_won',
                    'Congratulations! You Won!',
                    'You won the auction for "' || listing_title || '" with a bid of $' || highest_bid.amount,
                    NEW.id,
                    NEW.owner_id,
                    jsonb_build_object(
                        'final_bid', highest_bid.amount,
                        'seller_name', seller_name
                    )
                );
            END IF;
        ELSE
            -- No bids - notify seller
            PERFORM create_notification(
                NEW.owner_id,
                'listing_ended_seller',
                'Your Auction Ended',
                'Your auction for "' || listing_title || '" ended with no bids',
                NEW.id,
                NULL,
                jsonb_build_object(
                    'had_bids', false
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auction ended notifications
DROP TRIGGER IF EXISTS trigger_notify_auction_ended ON listings;
CREATE TRIGGER trigger_notify_auction_ended
    AFTER UPDATE OF status ON listings
    FOR EACH ROW
    EXECUTE FUNCTION notify_auction_ended();

-- Create a function to send email when notification is created
CREATE OR REPLACE FUNCTION trigger_send_notification_email()
RETURNS TRIGGER AS $$
DECLARE
    app_url TEXT := 'https://frothmonkey.com';
    listing_data RECORD;
    email_data JSONB;
BEGIN
    -- Build email data based on notification type
    IF NEW.type = 'bid_outbid' THEN
        SELECT title INTO listing_data FROM listings WHERE id = NEW.listing_id;
        
        email_data := jsonb_build_object(
            'listingId', NEW.listing_id,
            'listingTitle', COALESCE(listing_data.title, 'Unknown Listing'),
            'previousBid', (NEW.metadata->>'previous_bid')::NUMERIC,
            'newBid', (NEW.metadata->>'new_bid')::NUMERIC
        );
        
    ELSIF NEW.type LIKE 'time_warning_%' THEN
        SELECT title, current_price INTO listing_data 
        FROM listings WHERE id = NEW.listing_id;
        
        email_data := jsonb_build_object(
            'listingId', NEW.listing_id,
            'listingTitle', COALESCE(listing_data.title, 'Unknown Listing'),
            'currentBid', COALESCE(listing_data.current_price, 0),
            'isLeadingBidder', COALESCE((NEW.metadata->>'is_leading_bidder')::BOOLEAN, false)
        );
        
    ELSIF NEW.type = 'listing_ended_seller' THEN
        SELECT title INTO listing_data FROM listings WHERE id = NEW.listing_id;
        
        email_data := jsonb_build_object(
            'listingId', NEW.listing_id,
            'listingTitle', COALESCE(listing_data.title, 'Unknown Listing'),
            'finalBid', COALESCE((NEW.metadata->>'final_bid')::NUMERIC, 0),
            'buyerName', COALESCE(NEW.metadata->>'buyer_name', 'Unknown'),
            'reserveMet', COALESCE((NEW.metadata->>'reserve_met')::BOOLEAN, false),
            'hadBids', COALESCE((NEW.metadata->>'had_bids')::BOOLEAN, false)
        );
        
    ELSIF NEW.type = 'auction_won' THEN
        SELECT title INTO listing_data FROM listings WHERE id = NEW.listing_id;
        
        email_data := jsonb_build_object(
            'listingId', NEW.listing_id,
            'listingTitle', COALESCE(listing_data.title, 'Unknown Listing'),
            'finalBid', COALESCE((NEW.metadata->>'final_bid')::NUMERIC, 0),
            'sellerName', COALESCE(NEW.metadata->>'seller_name', 'The seller')
        );
    ELSE
        -- For other notification types, don't send email
        RETURN NEW;
    END IF;
    
    -- Make HTTP request to send email via Next.js API
    -- Note: This requires pg_net extension or Edge Function
    -- For now, we'll rely on the application to poll and send emails
    -- You can implement this with Supabase Edge Functions or pg_net
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send emails when notifications are created
-- Note: This trigger is created but the actual email sending should be done
-- via the application or Edge Functions for better error handling
DROP TRIGGER IF EXISTS trigger_send_email_on_notification ON notifications;
CREATE TRIGGER trigger_send_email_on_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_notification_email();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_time_warning_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION notify_auction_ended() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_send_notification_email() TO service_role;

