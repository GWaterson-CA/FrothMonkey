-- Add legal agreement tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bidding_agreement_accepted_at TIMESTAMPTZ NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ NULL;

-- Add constraint to ensure users have accepted terms before bidding
-- This will be enforced at the application level for existing users
