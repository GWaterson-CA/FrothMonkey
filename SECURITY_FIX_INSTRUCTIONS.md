# Security Fix Instructions

## Issues Identified by Supabase Security Advisor

Supabase identified 3 security errors related to Row Level Security (RLS):

1. **Policy Exists RLS Disabled** - `public.categories` table has policies but RLS is not enabled
2. **RLS Disabled in Public** - `public.share_events` table doesn't have RLS enabled  
3. **RLS Disabled in Public** - `public.categories` table doesn't have RLS enabled

## Root Cause

- **Categories table**: Migration 006 created an RLS policy (`categories_public_read`) but forgot to enable RLS on the categories table itself
- **Share_events table**: Migration 021 created the table but never enabled RLS on it

## Solution

Created migration `028_fix_rls_security_issues.sql` that:

1. ✅ Enables RLS on the `categories` table (which already has the `categories_public_read` policy allowing public read access)

2. ✅ Enables RLS on the `share_events` table and creates appropriate policies:
   - Admin-only read access for analytics purposes
   - Uses SECURITY DEFINER on the `record_share_event()` function to allow the API to insert tracking data while RLS is enabled

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/028_fix_rls_security_issues.sql`
4. Click **Run** to execute the migration

### Option 2: Via Supabase CLI
If you have the Supabase CLI installed and linked:

```bash
# From your project root
supabase db push
```

This will apply all pending migrations including the new security fix.

### Option 3: Manual SQL Execution
If you prefer to run it manually, open the SQL editor in Supabase and run:

```sql
-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on share_events table  
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Create admin policy for share_events
CREATE POLICY "Admins can view share events" ON share_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION record_share_event(
    platform_name TEXT,
    listing_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO share_events (
        platform,
        listing_id,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        platform_name,
        listing_uuid,
        user_uuid,
        ip_addr,
        user_agent_string
    );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION record_share_event(TEXT, UUID, UUID, INET, TEXT) TO authenticated, anon;
```

## Verification

After applying the migration, verify the fix:

1. Go to **Supabase Dashboard → Advisors → Security Advisor**
2. Click **Refresh** to re-run the security scan
3. Confirm all 3 errors are now resolved

## Impact

✅ **No Breaking Changes**: These changes only enable security that should have been there from the start.

- **Categories**: Still publicly readable (as intended), now properly protected by RLS
- **Share Events**: Tracking will continue to work via the API, but now only admins can read the data (more secure)

## Technical Details

### Categories Table
- The `categories_public_read` policy allows anyone to read categories
- This is correct since categories need to be publicly visible for navigation

### Share Events Table  
- Only admins can view share event analytics
- The `record_share_event()` function uses `SECURITY DEFINER` which means it runs with the privileges of the function owner (superuser), allowing it to insert records even though RLS is enabled
- This is a common pattern for tracking/logging functions that need to work for anonymous users

## Questions?

If you encounter any issues applying this migration, check:
- Database connection is active
- You have necessary permissions
- No conflicting policies exist (the migration handles cleanup)

