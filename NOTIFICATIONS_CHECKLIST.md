# Notification System - Setup Checklist

Complete these steps in order to activate the notification system.

## ☑️ Pre-Flight Check

- [ ] You have access to your Supabase Dashboard
- [ ] You can run Supabase CLI commands (or use SQL Editor)
- [ ] Your app is running locally for testing

## 📋 Setup Steps

### Step 1: Apply Database Migrations

**Using Supabase CLI (Recommended):**
```bash
cd /path/to/your/project
supabase db push
```

**Or Using Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/023_notifications_system.sql`
4. Run the query
5. Repeat for `supabase/migrations/024_schedule_time_notifications.sql`

**Verification:**
```sql
-- Run this in SQL Editor to verify
SELECT COUNT(*) FROM notifications;
-- Should return 0 (table exists but is empty)

SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
-- Should show 5 triggers
```

- [ ] Migrations applied successfully
- [ ] Triggers created
- [ ] Functions exist

---

### Step 2: Enable Realtime

1. Go to **Supabase Dashboard**
2. Navigate to **Database** → **Replication**
3. Find `notifications` table in the list
4. Toggle it **ON**
5. Ensure these events are enabled:
   - [x] Insert
   - [x] Update  
   - [x] Delete

**Verification:**
- [ ] `notifications` table shows "Realtime enabled"

---

### Step 3: Set Up Scheduled Notifications

1. Go to **Supabase Dashboard**
2. Navigate to **Database** → **Cron Jobs**
3. Click **"Enable Cron"** if not already enabled
4. Click **"Create a new cron job"**
5. Fill in:
   - **Job name:** `time_warning_notifications`
   - **Schedule:** `0 * * * *`
   - **Query:** `SELECT schedule_time_notifications();`
6. Click **"Create"**

**Verification:**
```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'time_warning_notifications';
-- Should return one row
```

- [ ] Cron job created and enabled

---

### Step 4: Test the System

#### Test 1: Question Notification
1. Log in as **User A**
2. Create a test listing
3. Log in as **User B** (different browser/incognito)
4. Ask a question on User A's listing
5. Switch back to User A → **Check for notification bell badge**

- [ ] Seller received "Question Received" notification

#### Test 2: First Bid Notification
1. As **User B**, place a bid on the listing
2. Switch to **User A** → **Check notifications**

- [ ] Seller received "First Bid Received" notification

#### Test 3: Outbid Notification
1. Log in as **User C**
2. Place a higher bid on the same listing
3. Switch to **User B** → **Check notifications**

- [ ] Previous bidder received "Outbid" notification

#### Test 4: Reserve Met Notification
1. As **User A**, edit listing to add a reserve price (e.g., $50)
2. Ensure current bid is below reserve
3. As **User C**, place bid above reserve price
4. Check notifications for:
   - **User A** (seller)
   - **User B** (has bid on listing)

- [ ] Seller received "Reserve Met" notification
- [ ] Bidders received "Reserve Met" notification

#### Test 5: Time Warnings (Manual Test)
```sql
-- Manually trigger time warnings
SELECT create_time_warning_notifications();
-- Check result: should return number of notifications created
```

- [ ] Function runs without errors
- [ ] Creates notifications for auctions ending in 24h/2h

#### Test 6: Listing Ended Notification
1. Create a short test listing (ends in 1 minute)
2. Wait for it to end
3. Run finalize function:
```sql
SELECT finalize_auctions();
```
4. Check notifications for seller

- [ ] Seller received "Listing Ended" notification

---

### Step 5: Verify UI Components

1. **Header Bell Icon:**
   - [ ] Bell icon visible when logged in
   - [ ] Badge shows correct unread count
   - [ ] Clicking opens dropdown with recent notifications
   - [ ] "Mark all as read" button works

2. **Notifications Dropdown:**
   - [ ] Shows 10 most recent notifications
   - [ ] Clicking notification navigates to listing
   - [ ] Can mark individual as read
   - [ ] "View all notifications" link works

3. **Notifications Page (`/account/notifications`):**
   - [ ] Shows all notifications
   - [ ] "All" and "Unread" tabs work
   - [ ] Can mark as read
   - [ ] Can delete notifications
   - [ ] Empty states display correctly

4. **Settings Page (`/account/settings`):**
   - [ ] Notification preferences section visible
   - [ ] Can toggle individual notification types
   - [ ] Master switch disables all
   - [ ] Changes save successfully

---

### Step 6: Performance Check

Run these queries to ensure indexes are working:

```sql
-- Should be fast (< 10ms for small datasets)
EXPLAIN ANALYZE 
SELECT * FROM notifications 
WHERE user_id = 'some-user-id' 
ORDER BY created_at DESC 
LIMIT 20;

-- Should use index
EXPLAIN ANALYZE 
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'some-user-id' 
AND read_at IS NULL;
```

- [ ] Queries use indexes
- [ ] Performance is acceptable

---

## 🎉 Launch Checklist

Before going to production:

- [ ] All tests passing
- [ ] Realtime enabled
- [ ] Cron job scheduled
- [ ] Notification preferences work
- [ ] Bell icon appears in header
- [ ] Notifications page accessible
- [ ] Database migrations applied to production
- [ ] Performance verified

---

## 🐛 Common Issues

### Issue: Notifications not appearing
**Solutions:**
- Check browser console for errors
- Verify Realtime is enabled
- Check if user has notifications disabled in settings
- Verify triggers are installed: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';`

### Issue: Real-time not working
**Solutions:**
- Confirm Realtime is enabled for notifications table
- Check browser console for WebSocket errors
- Verify Supabase URL and anon key are correct
- Check if adblockers are blocking WebSocket connections

### Issue: Time warnings not sending
**Solutions:**
- Check cron job is enabled: `SELECT * FROM cron.job;`
- Manually run function: `SELECT create_time_warning_notifications();`
- Check cron job logs in Supabase Dashboard
- Verify listings exist that end in 24h/2h

### Issue: Badge count incorrect
**Solutions:**
- Hard refresh the page (Cmd/Ctrl + Shift + R)
- Check if notifications query is correct
- Verify RLS policies allow user to see their notifications

---

## 📞 Need Help?

1. Check **NOTIFICATIONS_SETUP.md** for detailed documentation
2. Review **NOTIFICATIONS_SUMMARY.md** for architecture overview
3. Look at migration files for trigger logic
4. Check Supabase logs for database errors
5. Review browser console for client errors

---

## ✅ Completion

Once all checkboxes are checked, your notification system is fully operational! 🎊

Date completed: _______________

Notes:
_________________________________
_________________________________
_________________________________

