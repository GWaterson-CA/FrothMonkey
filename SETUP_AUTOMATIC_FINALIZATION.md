# 🚀 Setting Up Automatic Auction Finalization

**Status:** ⚠️ **NOT YET AUTOMATED** - You need to configure a cron job

## What's Already Working ✅

1. ✅ **Constraint Fixed** - `'listing_ended_seller'` notification type is now allowed
2. ✅ **Trigger Working** - When status changes from `'live'` → `'ended'`/`'sold'`, notifications are created
3. ✅ **Email Function** - Edge function sends emails when notifications are created
4. ✅ **Webhook** - Database webhook triggers edge function (assuming it's configured)

## What's Missing ⚠️

**The cron job that automatically finalizes auctions** - Without this, listings will stay `'live'` forever even after their `end_time` passes.

## Solution: Set Up Cron Job

You have **2 options**:

---

## Option 1: Supabase Database Cron Job (Recommended)

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: **Database** → **Cron Jobs**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT/database/cron`

2. **Create New Cron Job**
   - Click **"Create a new cron job"** or **"New Cron Job"**

3. **Configure:**
   - **Name:** `finalize-auctions`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
     - Or `*/1 * * * *` for every minute (more frequent)
   - **SQL Command:** `SELECT finalize_auctions();`
   - **Active:** ✅ Enabled

4. **Save** - Click "Create" or "Save"

### Verify It's Working:

Run `CHECK_AUTOMATION_SETUP.sql` or `SETUP_AUTOMATIC_FINALIZATION.sql` to check if the cron job exists.

---

## Option 2: External Cron Service + Edge Function

If Supabase cron jobs aren't available or you prefer external control:

### Step 1: Deploy Edge Function (if not already deployed)

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
npx supabase functions deploy finalize-auctions
```

### Step 2: Set Up External Cron

Use Vercel Cron, GitHub Actions, or any cron service to call:
```
POST https://YOUR_PROJECT.supabase.co/functions/v1/finalize-auctions
Headers: Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

---

## Testing the Setup

### Test 1: Check Current Status

Run `CHECK_AUTOMATION_SETUP.sql` to verify:
- If cron job is configured
- If it's active
- How many auctions are stuck

### Test 2: Manual Test

Run this manually to see if it works:
```sql
SELECT finalize_auctions();
```

This should return the number of auctions finalized (0 if none need finalizing).

---

## Summary

**To make future listings automatically finalize:**

1. ✅ Constraint fixed (already done)
2. ✅ Trigger working (already done)  
3. ⚠️ **SET UP CRON JOB** (you need to do this)
4. ✅ Webhook configured (assuming it's already set up)
5. ✅ Edge function deployed (assuming it's already deployed)

**Once the cron job is set up, everything will be automated!** 🎉

