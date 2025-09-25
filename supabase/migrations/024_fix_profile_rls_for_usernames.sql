-- Fix RLS policies to allow public access to basic profile information for usernames
-- This ensures usernames are visible in bid history, questions, and seller info

-- Drop the overly restrictive profile policy
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;

-- Create separate policies for different operations
-- Allow public read access to basic profile info (username, avatar_url)
CREATE POLICY "profiles_public_read" ON profiles
    FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_own_update" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "profiles_own_insert" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "profiles_own_delete" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Add comment explaining the policy design
COMMENT ON POLICY "profiles_public_read" ON profiles IS 
'Allows public read access to profile information for displaying usernames in bid history, questions, and seller info. Sensitive data should be handled by application logic if needed.';
