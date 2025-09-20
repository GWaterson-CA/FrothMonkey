const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://ysoxcftclnlmvxuopdun.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb3hjZnRjbG5sbXZ4dW9wZHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE4ODYyNCwiZXhwIjoyMDY3NzY0NjI0fQ.EOFNjVgAc34omZNp57X4ZFuRZfoDZ6yBh_dn5hpQxMs'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function applySimpleAdminFunction() {
  try {
    console.log('Applying simple admin users function...')
    
    // Simple SQL to create the function
    const sql = `
-- Simple admin function to get all users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ) THEN
        -- If not admin, return empty result
        RETURN;
    END IF;

    -- Return all users for admin
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_admin,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
    `
    
    const { error } = await supabase.from('_temp').select('1').limit(1)
    
    if (error) {
      console.log('Testing connection... Creating function via direct SQL execution')
      
      // Try to create the function directly (this might not work via JS client)
      console.log('SQL to apply in Supabase Dashboard:')
      console.log('=====================================')
      console.log(sql)
      console.log('=====================================')
      console.log('')
      console.log('Please copy and paste the above SQL into your Supabase Dashboard > SQL Editor')
    }
    
    console.log('Simple admin function ready to apply!')
    
  } catch (error) {
    console.error('Error:', error)
    console.log('')
    console.log('Please apply this SQL manually in your Supabase Dashboard:')
    console.log('=====================================')
    console.log(`
-- Simple admin function to get all users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    ) THEN
        -- If not admin, return empty result
        RETURN;
    END IF;

    -- Return all users for admin
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.is_admin,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
    `)
    console.log('=====================================')
  }
}

applySimpleAdminFunction().then(() => {
  console.log('Script completed.')
  process.exit(0)
}).catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
