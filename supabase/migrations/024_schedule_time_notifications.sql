-- This migration sets up the scheduling for time-based notifications
-- Note: Actual cron scheduling needs to be configured in Supabase Dashboard or via API

-- Create a wrapper function that can be called by the edge function or scheduled job
CREATE OR REPLACE FUNCTION schedule_time_notifications()
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER;
BEGIN
    -- Call the time warning notification function
    SELECT create_time_warning_notifications() INTO notification_count;
    
    -- Log the result
    RAISE NOTICE 'Created % time warning notifications at %', notification_count, NOW();
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION schedule_time_notifications() TO service_role;

-- Note: To schedule this function to run every hour, configure in Supabase Dashboard:
-- 1. Go to Database > Cron Jobs
-- 2. Add new job with schedule: 0 * * * * (every hour at minute 0)
-- 3. SQL command: SELECT schedule_time_notifications();

