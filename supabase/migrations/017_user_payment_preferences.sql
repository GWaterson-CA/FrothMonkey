-- Add payment preferences to user profiles
-- Users can select multiple payment methods they accept as sellers

-- Add payment preferences column to profiles table
ALTER TABLE profiles ADD COLUMN payment_preferences TEXT[] DEFAULT '{}';

-- Add comment explaining the expected values
COMMENT ON COLUMN profiles.payment_preferences IS 'Array of payment methods the user accepts as a seller: cash, crypto, e-transfer, cheque, wire, bank_draft';

-- Add check constraint to ensure only valid payment methods are stored
ALTER TABLE profiles ADD CONSTRAINT valid_payment_preferences 
CHECK (
  payment_preferences <@ ARRAY['cash', 'crypto', 'e-transfer', 'cheque', 'wire', 'bank_draft']::TEXT[]
);

-- Create index for payment preferences queries (useful for future analytics)
CREATE INDEX idx_profiles_payment_preferences ON profiles USING gin(payment_preferences);
