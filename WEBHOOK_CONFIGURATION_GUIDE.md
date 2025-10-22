# 🔗 Database Webhooks Configuration Guide

**This is the critical step that's missing!**

---

## 🎯 What Are Database Webhooks?

Webhooks connect your database triggers to your edge functions.

```
WITHOUT WEBHOOKS:
User asks question → Database creates notification → ❌ STOPS HERE

WITH WEBHOOKS:
User asks question → Database creates notification → Webhook triggers → 
Edge function runs → Email sent → ✅ SUCCESS
```

---

## 📍 Where to Configure

**Supabase Dashboard → Database → Webhooks**

URL: `https://supabase.com/dashboard/project/YOUR_PROJECT/database/webhooks`

---

## 🔧 Required Webhooks (3 Total)

### Webhook #1: Send Notification Emails

**Purpose:** Sends emails for Q&A notifications (question received & answered)

| Setting | Value |
|---------|-------|
| **Name** | `Send Notification Emails` |
| **Schema** | `public` |
| **Table** | `notifications` |
| **Events** | ☑ INSERT (only!) |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-notification-emails` |

**No conditions needed**
**No custom payload needed**

**Screenshot walkthrough:**
```
1. Click "Create Webhook" or "Enable Webhooks"
2. Enter name: "Send Notification Emails"
3. Select table: "notifications" from dropdown
4. Check only "INSERT" event
5. Select type: "Supabase Edge Functions"
6. Select function: "send-notification-emails"
7. Click "Create" or "Save"
```

---

### Webhook #2: Admin Notification - New User

**Purpose:** Sends email to admin when a new user registers

| Setting | Value |
|---------|-------|
| **Name** | `Admin Notification - New User` |
| **Schema** | `public` |
| **Table** | `admin_notification_log` |
| **Events** | ☑ INSERT (only!) |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-admin-notifications` |
| **HTTP Method** | POST |

**Filter Condition:**
```
notification_type eq new_user
```

**HTTP Payload (JSON):**
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

**Screenshot walkthrough:**
```
1. Click "Create Webhook"
2. Enter name: "Admin Notification - New User"
3. Select table: "admin_notification_log"
4. Check only "INSERT" event
5. Select type: "Supabase Edge Functions"
6. Select function: "send-admin-notifications"
7. Click "Add Filter" or "Conditions"
8. Set: notification_type eq new_user
9. Click "Edit Payload" or "HTTP Payload"
10. Switch to JSON editor
11. Paste the JSON payload above
12. Click "Create" or "Save"
```

---

### Webhook #3: Admin Notification - New Listing

**Purpose:** Sends email to admin when a new listing is created

| Setting | Value |
|---------|-------|
| **Name** | `Admin Notification - New Listing` |
| **Schema** | `public` |
| **Table** | `admin_notification_log` |
| **Events** | ☑ INSERT (only!) |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-admin-notifications` |
| **HTTP Method** | POST |

**Filter Condition:**
```
notification_type eq new_listing
```

**HTTP Payload (JSON):**
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

**Screenshot walkthrough:**
```
1. Click "Create Webhook"
2. Enter name: "Admin Notification - New Listing"
3. Select table: "admin_notification_log"
4. Check only "INSERT" event
5. Select type: "Supabase Edge Functions"
6. Select function: "send-admin-notifications"
7. Click "Add Filter" or "Conditions"
8. Set: notification_type eq new_listing
9. Click "Edit Payload" or "HTTP Payload"
10. Switch to JSON editor
11. Paste the JSON payload above
12. Click "Create" or "Save"
```

---

## ✅ Verification

After creating webhooks:

1. **Check they appear in the list:**
   - Go to Database → Webhooks
   - Should see 3 webhooks listed

2. **Test with SQL script:**
   - Run `TEST_EMAIL_AUTOMATION.sql` in SQL Editor
   - Should trigger webhooks

3. **Check webhook logs:**
   - Click on each webhook
   - Go to "Logs" tab
   - Should see successful requests after testing

---

## 🐛 Troubleshooting

### "Edge Function not found in dropdown"
**Solution:** Deploy edge functions first:
```bash
npx supabase functions deploy send-notification-emails
npx supabase functions deploy send-admin-notifications --no-verify-jwt
```

### "Table not found in dropdown"
**Solution:** Apply migrations first:
```bash
npx supabase db push
```
Or run the migration SQL files in Supabase SQL Editor.

### "Webhook created but not triggering"
**Check:**
1. Edge function is deployed
2. Table name is correct
3. Event is INSERT
4. Condition syntax is correct (for admin webhooks)
5. Payload JSON is valid (for admin webhooks)

### "Webhook triggering but emails not sent"
**Check:**
1. Edge function logs (Edge Functions → Click function → Logs)
2. RESEND_API_KEY is set in edge function secrets
3. Resend dashboard for errors

---

## 📊 Expected Behavior

### When User Asks Question:
```
1. Row inserted into notifications table
2. Webhook #1 triggers instantly
3. Calls send-notification-emails function
4. Email sent to seller
5. Appears in Resend dashboard
```

### When Seller Answers Question:
```
1. Row inserted into notifications table
2. Webhook #1 triggers instantly
3. Calls send-notification-emails function
4. Email sent to user who asked
5. Appears in Resend dashboard
```

### When New User Registers:
```
1. Row inserted into admin_notification_log
2. Webhook #2 triggers instantly
3. Calls send-admin-notifications function
4. Email sent to frothmonkeyca@gmail.com
5. Appears in Resend dashboard
```

### When New Listing Created:
```
1. Row inserted into admin_notification_log
2. Webhook #3 triggers instantly
3. Calls send-admin-notifications function
4. Email sent to frothmonkeyca@gmail.com
5. Appears in Resend dashboard
```

---

## 🎯 Why This Step Is Critical

**Without webhooks, your system looks like this:**

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ DB Trigger   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Notification │
│   Created    │
└──────────────┘
       
       ❌ STOPS HERE - No email sent!
```

**With webhooks configured:**

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ DB Trigger   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Notification │
│   Created    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 🔗 WEBHOOK   │ ◄── THIS IS THE CRITICAL PIECE!
│   Triggers   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Edge Function│
│    Runs      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ ✅ Email     │
│    Sent!     │
└──────────────┘
```

---

## 📝 Quick Checklist

Before configuring webhooks:
- [ ] Migrations applied (`npx supabase db push`)
- [ ] Edge functions deployed
- [ ] RESEND_API_KEY secret set
- [ ] APP_URL secret set

While configuring webhooks:
- [ ] Webhook #1: notifications → send-notification-emails
- [ ] Webhook #2: admin_notification_log (new_user) → send-admin-notifications
- [ ] Webhook #3: admin_notification_log (new_listing) → send-admin-notifications

After configuring webhooks:
- [ ] Run `TEST_EMAIL_AUTOMATION.sql`
- [ ] Check Resend dashboard
- [ ] Check webhook logs
- [ ] Clean up test data

---

## 🎉 Success Indicators

You'll know webhooks are working when:

1. ✅ Test script creates notifications
2. ✅ Webhook logs show successful requests
3. ✅ Edge function logs show email sent
4. ✅ Resend dashboard shows emails
5. ✅ Email inbox shows received emails

---

## 📞 Still Stuck?

If webhooks still don't work:

1. **Check Edge Function Logs:**
   - Supabase Dashboard → Edge Functions
   - Click function name → Logs tab
   - Look for errors

2. **Check Webhook Logs:**
   - Supabase Dashboard → Database → Webhooks
   - Click webhook name → Logs tab
   - Look for failed requests

3. **Manual Test:**
   - Insert a test record directly in SQL
   - Watch webhook logs
   - Check if it triggers

4. **Review This Guide:**
   - Make sure all settings match exactly
   - Double-check payload JSON
   - Verify condition syntax

---

**This is the most important step in the entire setup!**

Once webhooks are configured, everything will work. 🚀

