# 🧪 Testing Your Auction Finalization Automation

## Quick Verification Steps

### 1. **Check Cron Job Status**

Run `VERIFY_CRON_JOB_WORKING.sql` - it will show you:
- ✅ If cron job exists and is active
- ✅ How many auctions are stuck (should be 0)
- ✅ Recent finalizations
- ✅ Recent notifications

### 2. **Manual Test**

Run this in SQL Editor to manually trigger finalization:

```sql
SELECT finalize_auctions();
```

This should return a number (0 if no auctions need finalizing, or the count of auctions finalized).

### 3. **End-to-End Test (Recommended)**

Create a test listing that ends very soon:

```sql
-- Get your user ID first
SELECT id FROM profiles WHERE username = 'YOUR_USERNAME';

-- Create test listing (replace YOUR_USER_ID and CATEGORY_ID)
INSERT INTO listings (
    owner_id,
    title,
    description,
    category_id,
    start_price,
    current_price,
    status,
    start_time,
    end_time
) VALUES (
    'YOUR_USER_ID',  -- Replace with your actual user ID
    '🧪 TEST LISTING - Auto Finalize',
    'This listing will end in 2 minutes for testing automation',
    (SELECT id FROM categories LIMIT 1),  -- Uses first category
    10.00,
    10.00,
    'live',
    NOW(),
    NOW() + INTERVAL '2 minutes'
) RETURNING id, title, end_time;
```

**Then:**
1. Note the `id` returned
2. Wait 5-7 minutes (cron runs every 5 minutes)
3. Check if status changed:
   ```sql
   SELECT id, title, status, end_time, updated_at 
   FROM listings 
   WHERE id = 'THE_ID_FROM_ABOVE';
   ```
4. Check if notification was created:
   ```sql
   SELECT * FROM notifications 
   WHERE listing_id = 'THE_ID_FROM_ABOVE';
   ```
5. Check if email was sent (in Resend dashboard)

### 4. **Monitor Cron Execution**

Check cron job execution history:

```sql
SELECT 
    jobid,
    start_time,
    end_time,
    status,
    return_message
FROM cron.job_run_details
WHERE jobid IN (
    SELECT jobid FROM cron.job WHERE jobname = 'finalize-auctions'
)
ORDER BY start_time DESC
LIMIT 10;
```

This shows:
- When the job last ran
- If it succeeded (`succeeded`)
- Any error messages

### 5. **Check for Stuck Auctions**

Run this periodically to ensure nothing is stuck:

```sql
SELECT 
    COUNT(*) as stuck_count,
    MIN(end_time) as oldest_stuck,
    MAX(end_time) as newest_stuck
FROM listings
WHERE status = 'live' 
  AND NOW() >= end_time;
```

**Expected Result:** Should be `0` after cron job runs.

---

## Troubleshooting

### Cron Job Not Running?

1. **Check if it's active:**
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'finalize-auctions';
   ```
   Should return `true`

2. **Check pg_cron extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
   Should return a row

3. **Manual trigger test:**
   ```sql
   SELECT finalize_auctions();
   ```
   If this works, the function is fine - issue is with cron scheduling

### Notifications Not Created?

1. Check if trigger exists:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%notify%auction%ended%';
   ```

2. Check if constraint allows the type:
   ```sql
   SELECT check_clause 
   FROM information_schema.check_constraints 
   WHERE constraint_name = 'notifications_type_check';
   ```
   Should include `'listing_ended_seller'`

### Emails Not Sending?

1. Check if webhook is configured:
   - Go to **Database** → **Webhooks**
   - Look for webhook on `notifications` table

2. Check edge function logs:
   - Go to **Edge Functions** → **send-notification-emails** → **Logs**

---

## Success Criteria ✅

Your automation is working correctly if:

1. ✅ Cron job exists and is active
2. ✅ No stuck auctions (`stuck_count = 0`)
3. ✅ Recent finalizations appear in listings table
4. ✅ Notifications are created for finalized listings
5. ✅ Emails appear in Resend dashboard

Run `VERIFY_CRON_JOB_WORKING.sql` to check all of these at once!

