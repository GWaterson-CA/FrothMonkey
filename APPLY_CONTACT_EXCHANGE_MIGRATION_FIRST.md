# 🚨 Apply Contact Exchange Migration First

The error `relation "auction_contacts" does not exist` means the migration hasn't been applied yet.

## Quick Fix - Apply Migrations in 3 Steps

### Step 1: Apply the Contact Exchange Migration

**Option A - Via Supabase Dashboard (EASIEST):**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/026_auction_contact_exchange.sql`
4. Copy **ALL** the contents (370 lines)
5. Paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

**Option B - Via Supabase CLI:**
```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
supabase db push
```

### Step 2: Add Notification Types to Constraint (IMPORTANT!)

The contact exchange functions use notification types that aren't in the constraint. You MUST run this:

**Option A - Via Supabase Dashboard:**
1. Go to **SQL Editor**
2. Open the file: `FIX_CONTACT_EXCHANGE_NOTIFICATION_TYPES.sql`
3. Copy **ALL** contents
4. Paste into SQL Editor
5. Click **Run**

**Option B - Via Migration:**
If using migrations, apply: `supabase/migrations/049_add_contact_exchange_notification_types.sql`

### Step 3: Verify Migrations Applied

Run this in SQL Editor to verify:
```sql
-- Check if tables exist
SELECT 
  'auction_contacts' as table_name,
  COUNT(*) as row_count
FROM auction_contacts
UNION ALL
SELECT 
  'auction_messages' as table_name,
  COUNT(*) as row_count
FROM auction_messages;

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_contact_exchange',
    'approve_contact_exchange',
    'decline_contact_exchange'
  );

-- Check if notification types are in constraint
SELECT 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'notifications_type_check'
  AND check_clause LIKE '%contact_shared%';
```

Expected results:
- ✅ Both tables should exist (row_count may be 0)
- ✅ All three functions should exist
- ✅ Constraint should include contact exchange types

### Step 4: Run Your Test Script

After both migrations are applied, you can run:
```sql
-- Now this will work
@CHECK_AND_CREATE_CONTACT_EXCHANGE.sql
```

## What These Migrations Create

**Migration 026:**
1. **Tables:**
   - `auction_contacts` - Contact exchange records
   - `auction_messages` - Messages between buyers/sellers

2. **Functions:**
   - `create_contact_exchange()` - Creates contact exchanges when auctions end
   - `approve_contact_exchange()` - Approves pending exchanges
   - `decline_contact_exchange()` - Declines pending exchanges

3. **Updates:**
   - `finalize_auctions()` function - Now creates contact exchanges automatically

**Migration 049 / Fix Script:**
- Adds 5 new notification types to the constraint:
  - `contact_shared`
  - `contact_approval_needed`
  - `contact_approved`
  - `contact_declined`
  - `new_message`

## Troubleshooting

**If you get "permission denied" errors:**
- Make sure you're using the SQL Editor in Supabase Dashboard (has full permissions)
- Or ensure your Supabase CLI is linked to the correct project

**If migration says "already exists":**
- That's fine - it means the migration was already applied
- You can proceed to the next step

**If you see errors about missing dependencies:**
- Make sure all previous migrations are applied
- Check that `create_notification()` function exists (from notifications migration)

**If you get constraint violation errors:**
- Make sure Step 2 (adding notification types) was completed
- The constraint MUST include the contact exchange notification types


