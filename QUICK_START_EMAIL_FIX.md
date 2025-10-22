# 🚀 Quick Start: Fix Email Automation in 20 Minutes

**Admin Email Updated To:** frothmonkeyca@gmail.com

---

## Step 1: Check Current Status (2 minutes)

**Go to Supabase Dashboard → SQL Editor**

Paste and run the entire contents of:
```
INVESTIGATE_EMAIL_AUTOMATION.sql
```

This will show you:
- ✅ What's already deployed
- ❌ What's missing

**Keep the SQL Editor tab open** - you'll need it for testing.

---

## Step 2: Deploy Edge Functions (5 minutes)

**Open Terminal and run:**

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"

# Deploy Q&A email function
npx supabase functions deploy send-notification-emails

# Deploy admin notification function (with new email address)
npx supabase functions deploy send-admin-notifications --no-verify-jwt
```

**Set secrets if not already done:**

```bash
npx supabase secrets set RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt
npx supabase secrets set APP_URL=https://frothmonkey.com
```

---

## Step 3: Configure Webhooks (10 minutes)

**This is the critical step that's probably missing!**

**Go to: Supabase Dashboard → Database → Webhooks**

### Webhook 1: Send Notification Emails

Click **"Create Webhook"** or **"Enable Webhooks"**

| Setting | Value |
|---------|-------|
| Name | `Send Notification Emails` |
| Table | `notifications` |
| Events | ☑ INSERT (only) |
| Type | **Supabase Edge Functions** |
| Edge Function | `send-notification-emails` |

Click **Create**

---

### Webhook 2: Admin - New User

Click **"Create Webhook"**

| Setting | Value |
|---------|-------|
| Name | `Admin Notification - New User` |
| Table | `admin_notification_log` |
| Events | ☑ INSERT (only) |
| Type | **Supabase Edge Functions** |
| Edge Function | `send-admin-notifications` |
| HTTP Method | POST |

**Filter Condition:**
```
notification_type eq new_user
```

**HTTP Payload (click "Edit" to use JSON editor):**
```json
{
  "type": "new_user",
  "record": {
    "id": "{{ record.record_id }}",
    "username": "{{ record.metadata.username }}",
    "full_name": "{{ record.metadata.full_name }}",
    "created_at": "{{ record.metadata.created_at }}"
  }
}
```

Click **Create**

---

### Webhook 3: Admin - New Listing

Click **"Create Webhook"**

| Setting | Value |
|---------|-------|
| Name | `Admin Notification - New Listing` |
| Table | `admin_notification_log` |
| Events | ☑ INSERT (only) |
| Type | **Supabase Edge Functions** |
| Edge Function | `send-admin-notifications` |
| HTTP Method | POST |

**Filter Condition:**
```
notification_type eq new_listing
```

**HTTP Payload (click "Edit" to use JSON editor):**
```json
{
  "type": "new_listing",
  "record": {
    "id": "{{ record.record_id }}",
    "title": "{{ record.metadata.title }}",
    "description": "{{ record.metadata.description }}",
    "owner_id": "{{ record.metadata.owner_id }}",
    "start_price": "{{ record.metadata.start_price }}",
    "cover_image_url": "{{ record.metadata.cover_image_url }}",
    "status": "{{ record.metadata.status }}",
    "created_at": "{{ record.metadata.created_at }}"
  }
}
```

Click **Create**

---

## Step 4: Test (2 minutes)

**Back in Supabase SQL Editor:**

Paste and run the entire contents of:
```
TEST_EMAIL_AUTOMATION.sql
```

This will:
1. ✅ Create a test question on your test listing
2. ✅ Answer the test question  
3. ✅ Trigger admin notification
4. ✅ Show you exactly what happened

---

## Step 5: Verify Emails Were Sent (1 minute)

### Check Resend Dashboard
**Go to:** https://resend.com/emails

You should see 3 new emails just sent:
1. 📧 "New question on..." → to seller
2. 📧 "Your question about... was answered" → to questioner
3. 📧 "New User Registered..." → to frothmonkeyca@gmail.com

### Check Email Inbox
**Check:** frothmonkeyca@gmail.com

You should see the "New User Registered" email.

---

## Step 6: Cleanup (30 seconds)

**In Supabase SQL Editor:**

Paste and run:
```
CLEANUP_TEST_DATA.sql
```

This removes all test questions and notifications.

---

## ✅ Done!

Your email automation is now working:
- ✅ Questions received → Email to seller
- ✅ Questions answered → Email to questioner
- ✅ New users → Email to frothmonkeyca@gmail.com

---

## 🐛 If Emails Still Don't Send

### Check Webhook Logs
1. Go to **Database → Webhooks**
2. Click on webhook name
3. Go to **Logs** tab
4. Look for errors

### Check Edge Function Logs
1. Go to **Edge Functions**
2. Click on function name
3. Go to **Logs** tab
4. Look for errors

### Common Issues
- ❌ Webhook not configured → No emails will send
- ❌ Edge function not deployed → Webhook fails
- ❌ RESEND_API_KEY not set → Email fails to send
- ❌ Wrong payload format → Webhook fails

---

## 📞 Need Help?

If stuck, check the detailed guide: **EMAIL_AUTOMATION_ACTION_PLAN.md**

Or run the diagnostic again:
```sql
-- In Supabase SQL Editor
-- Run: INVESTIGATE_EMAIL_AUTOMATION.sql
```

---

## 🎯 Why This Fixes It

**The Issue:** Database triggers create notifications, but webhooks are what actually call the edge functions to send emails.

**The Fix:** Adding webhooks creates the missing link between:
```
Database Trigger → Notification Created → [MISSING WEBHOOK] → Edge Function → Email Sent
```

Without webhooks, notifications are created but emails are never sent!

---

**Total Time: ~20 minutes**
**Difficulty: Easy**
**Coffee Required: 1 cup ☕**

