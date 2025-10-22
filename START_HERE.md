# 🚀 Email Automation Fix - START HERE

**Last Updated:** October 22, 2025  
**Admin Email:** frothmonkeyca@gmail.com ✅

---

## 📋 Quick Summary

Your email automation isn't working because **database webhooks aren't configured**. 

This is a 20-minute fix.

---

## 🎯 The Fix (4 Steps)

### Step 1: Check Current Status (2 min)

**Supabase Dashboard → SQL Editor**

Copy and paste the entire file:
```
INVESTIGATE_EMAIL_AUTOMATION.sql
```

Click **Run** and review the results.

---

### Step 2: Deploy Edge Functions (5 min)

**Terminal:**

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"

npx supabase functions deploy send-notification-emails
npx supabase functions deploy send-admin-notifications --no-verify-jwt

# Set secrets if needed
npx supabase secrets set RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt
npx supabase secrets set APP_URL=https://frothmonkey.com
```

---

### Step 3: Configure Webhooks (10 min) ⚡ CRITICAL

**Supabase Dashboard → Database → Webhooks**

Create 3 webhooks:

#### Webhook 1: Q&A Notifications
- Name: `Send Notification Emails`
- Table: `notifications`
- Events: INSERT
- Type: Edge Function
- Function: `send-notification-emails`

#### Webhook 2: New User Notifications
- Name: `Admin Notification - New User`
- Table: `admin_notification_log`
- Events: INSERT
- Condition: `notification_type eq new_user`
- Type: Edge Function
- Function: `send-admin-notifications`
- Payload:
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

#### Webhook 3: New Listing Notifications
- Name: `Admin Notification - New Listing`
- Table: `admin_notification_log`
- Events: INSERT
- Condition: `notification_type eq new_listing`
- Type: Edge Function
- Function: `send-admin-notifications`
- Payload:
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

**Need details?** See `QUICK_START_EMAIL_FIX.md`

---

### Step 4: Test (2 min)

**Supabase Dashboard → SQL Editor**

Copy and paste:
```
TEST_EMAIL_AUTOMATION.sql
```

Click **Run** and follow the instructions.

**Check:**
- https://resend.com/emails (should see 3 new emails)
- frothmonkeyca@gmail.com inbox (should see admin email)

---

## ✅ Done!

**Clean up test data:**

Copy and paste in SQL Editor:
```
CLEANUP_TEST_DATA.sql
```

---

## 🎉 What Now?

Your email automation is working:
- ✅ Question received → Email to seller
- ✅ Question answered → Email to user
- ✅ New user → Email to frothmonkeyca@gmail.com

---

## 📚 Need More Details?

| File | Purpose |
|------|---------|
| `QUICK_START_EMAIL_FIX.md` | Detailed step-by-step |
| `EMAIL_AUTOMATION_ACTION_PLAN.md` | Complete troubleshooting guide |
| `EMAIL_AUTOMATION_SUMMARY.md` | Overview and explanation |

---

## 🐛 Problems?

### Emails still not sending?
1. Check webhook logs (Database → Webhooks → Click webhook → Logs)
2. Check edge function logs (Edge Functions → Click function → Logs)
3. Check Resend dashboard (https://resend.com/emails)

### Need help?
Open `EMAIL_AUTOMATION_ACTION_PLAN.md` for detailed troubleshooting.

---

**Total Time:** ~20 minutes  
**Next Step:** Step 1 above ☝️

Let's fix this! 🚀

