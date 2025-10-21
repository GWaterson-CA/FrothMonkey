# 📧 Manual Test: Auto-Bid Email Notifications

## Quick Start

### Step 1: Delete the Test Listing

Run `DELETE_TEST_LISTING.sql` in Supabase SQL Editor to remove the test listing from your live site.

### Step 2: Apply Migration 040 (If Not Already Done)

```bash
cd /Users/geoffreywaterson/Documents/Cursor\ -\ Auction\ Marketplace
npx supabase db push
```

**OR** run `APPLY_AUTO_BID_NOTIFICATION_FIX.sql` in Supabase Dashboard.

### Step 3: Run Diagnostics

Run `DEBUG_EMAIL_NOTIFICATIONS.sql` in Supabase SQL Editor to check:
- ✅ Migration 040 is applied
- ✅ Your notification preferences allow emails
- ✅ Database webhook is configured
- ✅ Edge function is deployed

---

## Manual Test Procedure

### Setup (5 minutes)

1. **Create or find a test listing**
   - Either create a new listing from the UI
   - OR use an existing live listing for testing
   - Starting price: $20 recommended

2. **Use two browser profiles:**
   - **Browser 1:** Logged in as `chukkey@gmail.com` (auto-bid user)
   - **Browser 2:** Logged in as a different user (manual bidder)

### Test Scenario (3 bids)

#### Test 1: Set Auto-Bid ✅

**Browser 1 (chukkey@gmail.com):**
1. Go to the listing page
2. Toggle **"Auto Bid"** ON
3. Enter max bid: **$50**
4. Click **"Set Auto-Bid"**
5. Verify: Initial bid of ~$25 is placed

#### Test 2: Bid Within Auto-Bid Limit ❌ (No Email Expected)

**Browser 2 (other user):**
1. Go to the same listing
2. Place manual bid: **$30**
3. Verify: Auto-bid counters to $35

**Expected:** 
- ✅ Auto-bid places counter-bid at $35
- ❌ **NO EMAIL sent to chukkey@gmail.com** (auto-bid is protecting you)

#### Test 3: Another Bid Within Limit ❌ (No Email Expected)

**Browser 2 (other user):**
1. Place manual bid: **$40**
2. Verify: Auto-bid counters to $45

**Expected:**
- ✅ Auto-bid places counter-bid at $45
- ❌ **NO EMAIL sent to chukkey@gmail.com** (still protected)

#### Test 4: Bid Exceeds Auto-Bid Limit 📧 (EMAIL SHOULD SEND!)

**Browser 2 (other user):**
1. Place manual bid: **$60** (exceeds your $50 limit)
2. Verify: You are now the highest bidder

**Expected:**
- ✅ Auto-bid CANNOT counter (exceeds $50 max)
- ✅ User in Browser 2 becomes highest bidder
- 📧 **EMAIL SENT to chukkey@gmail.com** (limit exceeded!)

---

## Verification

### Check Notification Was Created

Run this query in Supabase SQL Editor:

```sql
-- Check if notification was created
SELECT 
    n.created_at,
    n.type,
    n.title,
    n.message,
    l.title as listing_title,
    l.current_price
FROM notifications n
JOIN listings l ON l.id = n.listing_id
JOIN auth.users u ON u.id = n.user_id
WHERE u.email = 'chukkey@gmail.com'
AND n.type = 'bid_outbid'
ORDER BY n.created_at DESC
LIMIT 5;
```

**Expected:** ONE row showing the outbid notification after the $60 bid

### Check Your Email Inbox

1. Check `chukkey@gmail.com` inbox
2. Check spam folder
3. Email subject: **"You've Been Outbid!"**

---

## Troubleshooting

### ❌ Notification Created But No Email

**Issue:** Notification exists in database but email wasn't sent

**Solutions:**

1. **Check Database Webhook:**
   - Go to Supabase Dashboard → Database → Webhooks
   - Look for webhook on `notifications` table
   - Events: `INSERT`
   - Should call `send-notification-emails` edge function

2. **Create Webhook if Missing:**
   ```
   Name: Send Notification Emails
   Table: notifications
   Events: INSERT
   Type: Edge Function
   Edge Function: send-notification-emails
   ```

3. **Check Edge Function is Deployed:**
   ```bash
   npx supabase functions deploy send-notification-emails
   ```

4. **Set Edge Function Environment Variables:**
   - `APP_URL` = Your app URL (e.g., https://frothmonkey.com)
   - `SUPABASE_URL` = Auto-provided
   - `SUPABASE_SERVICE_ROLE_KEY` = Auto-provided

### ❌ No Notification Created At All

**Issue:** Notification wasn't even created in the database

**Solutions:**

1. **Check Migration 040 is Applied:**
   ```sql
   SELECT routine_name, last_altered
   FROM information_schema.routines 
   WHERE routine_name = 'notify_bid_placed';
   ```
   Should show recent date.

2. **Check Trigger Exists:**
   ```sql
   SELECT trigger_name, event_object_table 
   FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_notify_bid_placed';
   ```
   Should return one row.

3. **Manually Apply Migration 040:**
   Run `APPLY_AUTO_BID_NOTIFICATION_FIX.sql`

### ❌ Getting Emails for Every Bid

**Issue:** Receiving emails for $30 and $40 bids (not just $60)

**Solution:** Migration 040 is NOT applied. The old notification logic is still active.

1. Apply Migration 040:
   ```bash
   npx supabase db push
   ```
   OR run `APPLY_AUTO_BID_NOTIFICATION_FIX.sql`

2. Verify the function was updated:
   ```sql
   SELECT pg_get_functiondef(oid) as function_definition
   FROM pg_proc 
   WHERE proname = 'notify_bid_placed';
   ```
   Should include text like "previous_bidder_auto_bid" and "max_amount"

---

## Success Criteria

✅ **PASS** if:
1. Bids at $30 and $40 do NOT trigger emails
2. Bid at $60 DOES trigger email
3. Only ONE email received total
4. Email arrives within 1-2 minutes

❌ **FAIL** if:
- Multiple emails received (migration not applied)
- No email at all (webhook/edge function issue)
- Email for every bid (old notification logic)

---

## Quick Commands

```bash
# Delete test listing
# Run: DELETE_TEST_LISTING.sql

# Debug email system
# Run: DEBUG_EMAIL_NOTIFICATIONS.sql

# Apply migration
npx supabase db push

# Deploy edge function
npx supabase functions deploy send-notification-emails
```

---

## Expected Timeline

- **$30 bid placed** → Auto-bid to $35 → Wait 30 seconds → ❌ No email
- **$40 bid placed** → Auto-bid to $45 → Wait 30 seconds → ❌ No email  
- **$60 bid placed** → Cannot counter → Wait 1-2 minutes → 📧 Email arrives!

---

## Notes

- **Auto-bid is protecting you** until someone exceeds your max ($50)
- **This prevents email spam** during auto-bid battles
- **Only ONE email** when your limit is exceeded
- **Matches eBay/TradeMe behavior** - professional and user-friendly

---

## Need Help?

If emails still aren't working after following this guide:

1. Check Supabase Dashboard → Database → Webhooks → View Logs
2. Check Edge Function logs for errors
3. Verify Resend API key is configured (if using Resend)
4. Check user notification preferences allow emails
5. Review `DEBUG_EMAIL_NOTIFICATIONS.sql` output

---

**Ready to test?** Start with Step 1: Delete the test listing! 🚀

