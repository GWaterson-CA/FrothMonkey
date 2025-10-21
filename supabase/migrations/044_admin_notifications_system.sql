-- Admin Notifications System
-- This migration sets up triggers to notify the admin (via email) when:
-- 1. A new user registers (profile is created)
-- 2. A new listing is created

-- Create a table to track admin notifications (for logging/debugging)
CREATE TABLE IF NOT EXISTS admin_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    record_id UUID NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB
);

-- Create index for admin notification log
CREATE INDEX idx_admin_notification_log_type_sent ON admin_notification_log(notification_type, sent_at DESC);

-- Enable Row Level Security for admin notification log
ALTER TABLE admin_notification_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the admin notification log
CREATE POLICY "Admins can view admin notification log" ON admin_notification_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create function to trigger admin notification for new users
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
BEGIN
    -- Get the webhook URL from environment or use default
    -- In production, this will be configured via Supabase dashboard
    webhook_url := current_setting('app.settings.admin_notification_webhook_url', true);
    
    -- If webhook URL is not set, skip notification but don't fail
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RAISE NOTICE 'Admin notification webhook URL not configured';
        RETURN NEW;
    END IF;

    -- Log the notification attempt
    INSERT INTO admin_notification_log (notification_type, record_id, metadata)
    VALUES ('new_user', NEW.id, jsonb_build_object(
        'username', NEW.username,
        'full_name', NEW.full_name,
        'created_at', NEW.created_at
    ));

    -- Note: The actual HTTP call will be handled by a database webhook
    -- configured in Supabase dashboard that triggers on admin_notification_log inserts
    -- where notification_type = 'new_user'

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to trigger admin notification for new listings
CREATE OR REPLACE FUNCTION notify_admin_new_listing()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
BEGIN
    -- Get the webhook URL from environment or use default
    webhook_url := current_setting('app.settings.admin_notification_webhook_url', true);
    
    -- If webhook URL is not set, skip notification but don't fail
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RAISE NOTICE 'Admin notification webhook URL not configured';
        RETURN NEW;
    END IF;

    -- Log the notification attempt
    INSERT INTO admin_notification_log (notification_type, record_id, metadata)
    VALUES ('new_listing', NEW.id, jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description,
        'owner_id', NEW.owner_id,
        'start_price', NEW.start_price,
        'reserve_price', NEW.reserve_price,
        'buy_now_price', NEW.buy_now_price,
        'cover_image_url', NEW.cover_image_url,
        'status', NEW.status,
        'created_at', NEW.created_at
    ));

    -- Note: The actual HTTP call will be handled by a database webhook
    -- configured in Supabase dashboard that triggers on admin_notification_log inserts
    -- where notification_type = 'new_listing'

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registrations
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON profiles;
CREATE TRIGGER trigger_notify_admin_new_user
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_user();

-- Create trigger for new listings
DROP TRIGGER IF EXISTS trigger_notify_admin_new_listing ON listings;
CREATE TRIGGER trigger_notify_admin_new_listing
    AFTER INSERT ON listings
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_listing();

-- Grant necessary permissions
GRANT SELECT, INSERT ON admin_notification_log TO authenticated;
GRANT SELECT, INSERT ON admin_notification_log TO service_role;

-- Add helpful comment
COMMENT ON TABLE admin_notification_log IS 'Logs all admin notification attempts for debugging and monitoring purposes';
COMMENT ON FUNCTION notify_admin_new_user() IS 'Triggers admin email notification when a new user profile is created';
COMMENT ON FUNCTION notify_admin_new_listing() IS 'Triggers admin email notification when a new listing is created';

