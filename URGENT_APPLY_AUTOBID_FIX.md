# 🚨 URGENT: Apply Auto-bid Fix to Database

## The Issue

The code for the fix was pushed to GitHub in v2.8.27, but **the database migration hasn't been applied yet**. The fix won't work until you run the SQL migration on your production database.

## What's Happening Now (Broken)

- Price: $31
- User A: autobid max $34 (set first)
- User B: autobid max $37 (set second)
- **Current result:** User B wins at $34 ❌ (User A never got their $34 bid)

## What Should Happen (After Fix)

- Price: $31
- User A: autobid max $34 (set first)
- User B: autobid max $37 (set second)
- **Correct result:** User A gets $34, User B counters at $35 ✅

---

## How to Apply the Fix (Choose One Method)

### Method 1: Using Supabase Dashboard (RECOMMENDED - Fastest)

1. **Go to your Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Copy and paste** the entire contents of `APPLY_AUTOBID_MAX_PRIORITY_FIX.sql` into the SQL editor

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify it worked** by running `VERIFY_AUTOBID_FIX_APPLIED.sql`
   - You should see: ✅ FIX IS APPLIED

5. **Done!** The fix is now active for all future auto-bids

---

### Method 2: Using Supabase CLI (If Linked)

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Verify
psql YOUR_DATABASE_URL -f VERIFY_AUTOBID_FIX_APPLIED.sql
```

---

## After Applying

### Test on the Current Auction

Since the current auction already has User B at $34 (incorrect), you can:

**Option A: Let it finish** and the fix will work for all future auctions

**Option B: Fix this auction manually** (if you want to correct it now):

```sql
-- Find the auction
SELECT id, title, current_price FROM listings WHERE current_price = 34;

-- See the current bids
SELECT bidder_id, amount, is_auto_bid, created_at 
FROM bids 
WHERE listing_id = 'YOUR_LISTING_ID'
ORDER BY created_at DESC;

-- If you want to correct it manually:
-- Delete User B's $34 bid and let auto-bid re-process
-- (Only do this if you're comfortable with SQL operations)
```

---

## Verification Steps

After applying the fix, verify it worked:

1. Run `VERIFY_AUTOBID_FIX_APPLIED.sql` in Supabase SQL Editor
2. Should see: ✅ FIX IS APPLIED
3. Test with a new auction to confirm behavior

---

## Testing the Fix

Create a quick test:

```sql
-- Create a test listing
INSERT INTO listings (owner_id, title, start_price, current_price, start_time, end_time, status)
VALUES (
    (SELECT id FROM profiles LIMIT 1),
    'TEST: Autobid Priority',
    10,
    10,
    NOW(),
    NOW() + INTERVAL '1 day',
    'live'
) RETURNING id;

-- Get two test users
-- User A sets autobid to $25
SELECT set_auto_bid('USER_A_ID', 'LISTING_ID', 25);

-- User B sets autobid to $30
SELECT set_auto_bid('USER_B_ID', 'LISTING_ID', 30);

-- Check the results
SELECT bidder_id, amount, is_auto_bid, created_at
FROM bids
WHERE listing_id = 'LISTING_ID'
ORDER BY created_at;

-- Expected: User A should have the $25 bid, User B should have $26
```

---

## What This Fix Does

Changes the ORDER BY clause in `process_auto_bids()` from:

```sql
-- OLD (broken)
ORDER BY ab.max_amount DESC, ab.created_at ASC
```

To:

```sql
-- NEW (fixed)
ORDER BY 
  CASE WHEN ab.max_amount = v_required_min THEN 0 ELSE 1 END,
  CASE WHEN ab.max_amount = v_required_min THEN ab.created_at END ASC,
  ab.max_amount DESC,
  ab.created_at ASC
```

This ensures that when the required bid equals someone's max, they get priority.

---

## Need Help?

If you run into issues:

1. Check `VERIFY_AUTOBID_FIX_APPLIED.sql` to see if fix is applied
2. Look at the function definition to see what ORDER BY clause is being used
3. Make sure no other migrations are pending

The fix is safe to apply - it only changes bid selection order, no data is modified.

