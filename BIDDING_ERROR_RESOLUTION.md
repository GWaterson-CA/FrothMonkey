# Bidding Error - Comprehensive Resolution

## 🔍 Problem Analysis

Your bidding system is failing due to a **database function signature conflict** in the `place_bid` function.

### Root Cause

1. **Migration 017** (`017_fix_bid_vs_buynow_logic.sql`) created a 4-parameter version:
   ```sql
   place_bid(listing_id UUID, bid_amount NUMERIC, bidder UUID, is_buy_now BOOLEAN)
   ```

2. **Earlier migrations** had a 3-parameter version:
   ```sql
   place_bid(listing_id UUID, bid_amount NUMERIC, bidder UUID)
   ```

3. **Your API code** (`app/api/rpc/place-bid/route.ts`) calls the 3-parameter version:
   ```typescript
   await supabase.rpc('place_bid', {
     listing_id: listingId,
     bid_amount: amount,
     bidder: user.id,
   })
   ```

4. **PostgreSQL conflict**: Having multiple function signatures can cause PostgreSQL to pick the wrong one or fail to resolve which function to call.

### Migration 025 Solution

Migration `025_remove_duplicate_place_bid.sql` was created to fix this by:
- Dropping the 4-parameter version
- Keeping only the 3-parameter version with improved logic
- Handling Buy Now internally without needing the `is_buy_now` parameter

---

## ✅ Solution - Apply the Fix

### Quick Fix (2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix**
   - Open the file `APPLY_THIS_FIX.sql` (in your project root)
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd+Enter)

4. **Verify**
   The verification query at the end should show:
   ```
   function_name | num_parameters | parameters
   place_bid     | 3              | listing_id uuid, bid_amount numeric, bidder uuid
   ```

5. **Test**
   - Go to your app
   - Try placing a bid
   - Should work now! ✨

---

## 🧪 Testing After Fix

Test these scenarios:

1. **Regular Bid**
   - Place a bid above the minimum
   - Should succeed and show toast notification
   - Should refresh to show your bid as highest

2. **Low Bid** 
   - Try bidding below minimum
   - Should fail with "Bid amount too low" message

3. **Buy Now** (if listing has Buy Now enabled)
   - Click "Buy Now" button
   - Should instantly purchase at Buy Now price
   - Listing should change to "Sold" status

4. **Anti-Sniping**
   - Bid in the last 30 seconds of an auction
   - End time should extend by 2 minutes

---

## 📋 What the Fix Does

The corrected `place_bid` function now properly handles:

### 1. **Validation**
- Listing exists and is live
- Auction is within time window (start_time to end_time)
- Bid meets minimum requirements

### 2. **Buy Now Logic**
- Only available when reserve price NOT met
- Instantly ends auction and creates transaction
- Sets listing status to 'sold'

### 3. **Regular Bidding**
- Inserts bid record
- Updates listing current_price
- Checks and updates reserve_met status

### 4. **Anti-Sniping**
- Extends auction by 2 minutes if bid placed in final seconds
- Returns updated end_time to frontend

### 5. **Notifications** (via trigger)
- Triggers `notify_bid_placed` after each bid
- Notifies seller on first bid
- Notifies previous highest bidder when outbid

---

## 🛠️ Technical Details

### Function Signature (After Fix)
```sql
CREATE OR REPLACE FUNCTION place_bid(
    listing_id UUID,
    bid_amount NUMERIC,
    bidder UUID
)
RETURNS JSONB
```

### Return Values

**Success:**
```json
{
  "accepted": true,
  "new_highest": 150.00,
  "end_time": "2025-09-30T15:30:00Z",
  "buy_now": false  // true if Buy Now was used
}
```

**Failure:**
```json
{
  "accepted": false,
  "reason": "Bid amount too low",
  "minimum_required": 155.00
}
```

---

## 🔧 Troubleshooting

### Still getting errors after applying fix?

#### Error: "trigger_notify_bid_placed does not exist"
**Solution:** Apply the notifications migration first:
```sql
-- In Supabase SQL Editor, run:
-- File: supabase/migrations/023_notifications_system_safe.sql
```

#### Error: "permission denied for table bids"
**Solution:** Check RLS policies allow authenticated users to insert:
```sql
SELECT * FROM pg_policies WHERE tablename = 'bids';
-- Should show policy allowing authenticated users to insert
```

#### Error: "create_notification function does not exist"
**Solution:** The notifications migration wasn't applied. Run it:
```sql
-- supabase/migrations/023_notifications_system_safe.sql
```

### Check Migration Status

To see which migrations have been applied:
```sql
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

---

## 📁 Files Modified/Created

### Modified:
- `supabase/migrations/025_remove_duplicate_place_bid.sql` - Verified correct syntax

### Created:
- `APPLY_THIS_FIX.sql` - Standalone SQL file to run in dashboard
- `BIDDING_ERROR_RESOLUTION.md` - This documentation

### Unchanged (reference):
- `app/api/rpc/place-bid/route.ts` - Already correctly calls 3-parameter version
- `components/bid-form.tsx` - Already correctly structured
- `017_fix_bid_vs_buynow_logic.sql` - Old migration (superseded by 025)

---

## 🎯 Summary

**The Issue:** Function signature conflict between 3-parameter and 4-parameter `place_bid` versions.

**The Fix:** Apply `APPLY_THIS_FIX.sql` in Supabase SQL Editor to remove duplicates.

**Time Required:** 2 minutes

**Testing:** Try placing bids to confirm everything works.

---

## 📞 Need Help?

If you still encounter issues:
1. Check the exact error message in browser console (F12 → Console)
2. Check Supabase logs: Dashboard → Logs → Postgres Logs
3. Verify the function exists: Run the verification query from `APPLY_THIS_FIX.sql`
4. Ensure all prerequisite migrations are applied (especially 023 for notifications)

---

**Status:** ✅ Ready to apply - Open `APPLY_THIS_FIX.sql` and follow instructions!
