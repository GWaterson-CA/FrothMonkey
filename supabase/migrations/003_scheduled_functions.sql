-- Enable pg_cron extension for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auction finalization to run every minute
-- Note: This will need to be set up in the Supabase dashboard or via API
-- as pg_cron requires superuser privileges which aren't available in migrations

-- Alternative: Create a function that can be called by Supabase's scheduled functions
CREATE OR REPLACE FUNCTION schedule_auction_finalization()
RETURNS void AS $$
DECLARE
    finalized_count INTEGER;
BEGIN
    -- Call the finalize_auctions function
    SELECT finalize_auctions(200) INTO finalized_count;
    
    -- Log the result
    RAISE NOTICE 'Finalized % auctions at %', finalized_count, NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION schedule_auction_finalization() TO service_role;
