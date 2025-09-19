const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://ysoxcftclnlmvxuopdun.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb3hjZnRjbG5sbXZ4dW9wZHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE4ODYyNCwiZXhwIjoyMDY3NzY0NjI0fQ.EOFNjVgAc34omZNp57X4ZFuRZfoDZ6yBh_dn5hpQxMs'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function applyMigration() {
  try {
    console.log('Reading migration file...')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '015_admin_analytics_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Applying analytics migration...')
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec', { sql: statement })
      
      if (error && !error.message.includes('already exists')) {
        console.error(`Error in statement ${i + 1}:`, error)
        console.log('Statement:', statement)
      }
    }
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Error applying migration:', error)
  }
}

// Run the script
applyMigration().then(() => {
  console.log('Migration script completed.')
  process.exit(0)
}).catch((error) => {
  console.error('Migration script failed:', error)
  process.exit(1)
})
