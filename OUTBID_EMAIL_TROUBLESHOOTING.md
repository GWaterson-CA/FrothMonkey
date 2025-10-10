# 🔍 Outbid Email Troubleshooting Guide

## Issue
You placed a bid on listing `2fb6feb4-5ae2-4644-89be-fe8493963ca1` but the previous bidder didn't receive an outbid email.

## Email Notification Flow

```
User Places Bid
    ↓
Database Trigger (notify_bid_placed)
    ↓
Create Notification in notifications table
    ↓
⚠️ DATABASE WEBHOOK (Critical!)
    ↓
Supabase Edge Function (send-notification-emails)
    ↓
Next.js API (/api/email/send-notification)
    ↓
Check User Preferences
    ↓
Send Email via Resend
```

## Likely Issues

### 1. ⚠️ Database Webhook Not Configured (MOST COMMON)

The webhook is what triggers emails when notifications are created. Without it, notifications will be created but emails won't be sent.

**Check if webhook exists:**
1. Go to **Supabase Dashboard**
2. Navigate to **Database** > **Webhooks**
3. Look for a webhook named "Send Notification Emails" or similar

**If webhook doesn't exist, create it:**
1. Click **Create a new webhook**
2. Configure:
   - **Name:** Send Notification Emails
   - **Table:** notifications
   - **Events:** INSERT
   - **Type:** Supabase Edge Functions
   - **Edge Function:** send-notification-emails
3. Click **Confirm**

### 2. Edge Function Not Deployed

The Edge Function needs to be deployed to Supabase.

**To deploy:**
```bash
cd /Users/geoffreywaterson/Documents/Cursor\ -\ Auction\ Marketplace
npx supabase functions deploy send-notification-emails
```

**Environment variables needed:**
- `APP_URL` - Your app URL (e.g., https://frothmonkey.com or http://localhost:3003)
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided

### 3. Migration Not Applied

The fix you just created needs to be applied to the database.

**Run this in Supabase SQL Editor:**
- Execute `APPLY_OUTBID_FIX.sql` (the file I just created)

### 4. User Has Email Notifications Disabled

The previous bidder might have disabled email notifications.

**Check with the query in `CHECK_NOTIFICATION_SETUP.sql`:**
```sql
-- Query #5 checks user notification preferences
```

### 5. No Previous Bidder Exists

If this was the first bid on the listing, there's no one to notify.

**Check with:**
```sql
-- Query #2 in CHECK_NOTIFICATION_SETUP.sql shows all bids
```

## Debugging Steps

### Step 1: Check if Notification Was Created

Run the queries in `CHECK_NOTIFICATION_SETUP.sql` in your Supabase SQL Editor.

**Expected:** You should see a `bid_outbid` notification created for the previous bidder.

**If no notification:** The trigger isn't working. Apply the migration.

**If notification exists:** Continue to Step 2.

### Step 2: Check Database Webhook

Go to **Supabase Dashboard** > **Database** > **Webhooks**

**Expected:** A webhook should exist for the `notifications` table.

**If no webhook:** Create it (see instructions above).

**If webhook exists:** Check webhook logs for errors.

### Step 3: Check Edge Function Deployment

In your terminal:
```bash
npx supabase functions list
```

**Expected:** `send-notification-emails` should be listed.

**If not listed:** Deploy it (see instructions above).

### Step 4: Check Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `send-notification-emails`
3. Check the **Logs** tab for any errors

### Step 5: Check User Preferences

Run query #5 from `CHECK_NOTIFICATION_SETUP.sql`

Look for:
```json
{
  "email_notifications": true,
  "bid_outbid": true
}
```

**If false:** User has disabled notifications (expected behavior).

### Step 6: Test Email Manually

Visit `/admin/email-test` and send a test outbid email to yourself.

**If test works:** The issue is specific to the bid flow.

**If test fails:** There's an issue with email configuration (RESEND_API_KEY).

## Quick Fix Checklist

- [ ] Run `APPLY_OUTBID_FIX.sql` in Supabase SQL Editor
- [ ] Verify webhook exists (Database > Webhooks)
- [ ] Deploy Edge Function: `npx supabase functions deploy send-notification-emails`
- [ ] Set Edge Function environment variable `APP_URL` in Supabase Dashboard
- [ ] Run queries in `CHECK_NOTIFICATION_SETUP.sql` to verify setup
- [ ] Place another test bid and check if email is sent

## Common Solutions

### Solution 1: Create the Webhook (Most Common)

```
Supabase Dashboard
→ Database
→ Webhooks
→ Create new hook
→ Table: notifications
→ Event: INSERT
→ Type: Supabase Edge Functions
→ Function: send-notification-emails
→ Confirm
```

### Solution 2: Set APP_URL Environment Variable

The Edge Function needs to know your app's URL.

```
Supabase Dashboard
→ Edge Functions
→ send-notification-emails
→ Settings
→ Environment Variables
→ Add: APP_URL = http://localhost:3003 (for local dev)
→ Save
```

### Solution 3: Deploy Edge Function

```bash
cd /Users/geoffreywaterson/Documents/Cursor\ -\ Auction\ Marketplace
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy send-notification-emails
```

## Verification

After fixing, verify the system works:

1. **Create a test listing** (or use an existing one)
2. **User A:** Place a bid
3. **User B:** Place a higher bid
4. **Expected:** User A receives an outbid email within seconds
5. **User A:** Place an even higher bid
6. **Expected:** User B receives an outbid email within seconds

## Still Not Working?

Check the comprehensive logs:

```bash
# Edge Function logs
npx supabase functions logs send-notification-emails

# Check recent notifications
# Run in Supabase SQL Editor:
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 20;

# Check webhook delivery status
# Go to: Supabase Dashboard > Database > Webhooks > Click your webhook > View logs
```

## Contact

If you've tried all these steps and emails still aren't sending, check:
1. Browser console for any errors when placing bids
2. Network tab for failed API calls
3. Supabase logs for trigger errors

The issue is most likely the missing webhook! 🎯

