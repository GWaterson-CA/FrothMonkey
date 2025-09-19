const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://ysoxcftclnlmvxuopdun.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb3hjZnRjbG5sbXZ4dW9wZHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE4ODYyNCwiZXhwIjoyMDY3NzY0NjI0fQ.EOFNjVgAc34omZNp57X4ZFuRZfoDZ6yBh_dn5hpQxMs'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createAdminUser() {
  const adminEmail = 'frothmonkey@myyahoo.com'
  const adminPassword = 'AdminPass123!' // You should change this after creation
  
  try {
    console.log('Creating admin user...')
    
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })
    
    if (authError) {
      throw authError
    }
    
    console.log('User created successfully:', authData.user.id)
    
    // Create the profile with admin privileges
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: 'admin',
        full_name: 'Administrator',
        is_admin: true
      })
    
    if (profileError) {
      throw profileError
    }
    
    console.log('Admin profile created successfully!')
    console.log('Admin account details:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('User ID:', authData.user.id)
    console.log('\nIMPORTANT: Please change the password after first login!')
    
  } catch (error) {
    if (error.message?.includes('User already registered')) {
      console.log('User already exists, updating to admin...')
      
      // Try to find existing user and update their profile
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === adminEmail)
      
      if (existingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', existingUser.id)
        
        if (updateError) {
          console.error('Error updating profile to admin:', updateError)
        } else {
          console.log('Successfully updated existing user to admin!')
          console.log('User ID:', existingUser.id)
        }
      }
    } else {
      console.error('Error creating admin user:', error)
    }
  }
}

// Run the script
createAdminUser().then(() => {
  console.log('Script completed.')
  process.exit(0)
}).catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
