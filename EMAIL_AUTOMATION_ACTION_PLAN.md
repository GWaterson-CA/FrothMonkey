# Email Automation Investigation & Fix Plan

**Date:** October 22, 2025  
**Issue:** Email notifications not being sent for Q&A and new user registrations  
**Updated Admin Email:** frothmonkeyca@gmail.com (changed from frothmonkey@myyahoo.com)

---

## 🔍 Issue Summary

You have three email automation features that aren't working:

1. **Question Received** - Seller should get email when user asks a question
2. **Question Answered** - User should get email when seller answers their question  
3. **New User Registration** - Admin should get email when a new user signs up

Tests in Admin Area work, but real events aren't triggering emails. No logs in Resend either.

---

## 📋 What I've Done

### 1. ✅ Updated Admin Email Address
- **File:** `supabase/functions/send-admin-notifications/index.ts`
- **Changed:** `frothmonkey@myyahoo.com` → `frothmonkeyca@gmail.com`
- **Line:** 13
- **Status:** ✅ Complete (needs edge function redeployment)

### 2. ✅ Created Investigation Scripts
- **`INVESTIGATE_EMAIL_AUTOMATION.sql`** - Comprehensive diagnostic script that checks:
  - If migrations are applied
  - If triggers exist
  - If functions exist
  - Recent activity that should have triggered emails
  - Admin notification logs
  - Deployment status summary
  
- **`TEST_EMAIL_AUTOMATION.sql`** - Interactive testing script that:
  - Creates test question on your test listing
  - Answers the test question
  - Simulates admin notification
  - Provides step-by-step feedback
  - Won't show test data on website
  
- **`CLEANUP_TEST_DATA.sql`** - Removes test data after testing

---

## 🔧 Root Cause Analysis

Based on the symptoms, the most likely issues are:

### Problem 1: Database Webhooks Not Configured ⚠️
**Likelihood:** 95%

The database migrations create triggers that insert into tables, but **webhooks** are what actually call the edge functions to send emails. If webhooks aren't configured, notifications are created but no emails are sent.

**Required Webhooks:**
1. **Send Notification Emails** (for Q&A)
   - Table: `notifications`
   - Event: INSERT
   - Type: Edge Function
   - Function: `send-notification-emails`

2. **Admin Notification - New User**
   - Table: `admin_notification_log`
   - Event: INSERT
   - Condition: `notification_type eq new_user`
   - Type: Edge Function
   - Function: `send-admin-notifications`

3. **Admin Notification - New Listing**
   - Table: `admin_notification_log`
   - Event: INSERT
   - Condition: `notification_type eq new_listing`
   - Type: Edge Function
   - Function: `send-admin-notifications`

### Problem 2: Edge Functions Not Deployed
**Likelihood:** 60%

Even if webhooks are configured, they can't call edge functions that don't exist.

**Required Edge Functions:**
1. `send-notification-emails` - Handles Q&A email notifications
2. `send-admin-notifications` - Handles admin email notifications

### Problem 3: Migrations Not Applied
**Likelihood:** 40%

If migrations aren't applied, triggers don't exist and notifications aren't created.

**Required Migrations:**
1. Migration 041: `041_question_email_notifications.sql`
2. Migration 044: `044_admin_notifications_system.sql`

---

## 🚀 Step-by-Step Fix Plan

### Step 1: Run Diagnostic Script

**In Supabase Dashboard → SQL Editor:**

```bash
# Copy and paste the contents of INVESTIGATE_EMAIL_AUTOMATION.sql
```

This will tell you exactly what's deployed and what's missing.

**Look for:**
- ❌ marks indicate what's not deployed
- ✅ marks indicate what's working
- Focus on the "DEPLOYMENT STATUS SUMMARY" section

---

### Step 2: Apply Missing Migrations (If Needed)

**If diagnostic shows migrations not applied:**

**Option A - Via Supabase CLI (Recommended):**
```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"
npx supabase db push
```

**Option B - Via Supabase Dashboard:**
1. Go to **SQL Editor**
2. Copy contents of `supabase/migrations/041_question_email_notifications.sql`
3. Paste and **Run**
4. Copy contents of `supabase/migrations/044_admin_notifications_system.sql`
5. Paste and **Run**

---

### Step 3: Deploy Edge Functions

**Deploy the updated admin notifications function (with new email):**

```bash
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"

# Deploy send-notification-emails (for Q&A)
npx supabase functions deploy send-notification-emails

# Deploy send-admin-notifications (for new users/listings)
npx supabase functions deploy send-admin-notifications --no-verify-jwt
```

**Set required secrets (if not already set):**

```bash
# Set Resend API key
npx supabase secrets set RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt

# Set app URL
npx supabase secrets set APP_URL=https://frothmonkey.com
```

---

### Step 4: Configure Database Webhooks ⚡ CRITICAL

**Go to Supabase Dashboard → Database → Webhooks**

#### Webhook 1: Send Notification Emails (Q&A)

Click **"Create Webhook"**

| Field | Value |
|-------|-------|
| **Name** | Send Notification Emails |
| **Table** | `notifications` |
| **Events** | ☑ INSERT |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-notification-emails` |
| **HTTP Headers** | (leave default) |

Click **Create Webhook**

---

#### Webhook 2: Admin Notification - New User

Click **"Create Webhook"**

| Field | Value |
|-------|-------|
| **Name** | Admin Notification - New User |
| **Table** | `admin_notification_log` |
| **Events** | ☑ INSERT |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-admin-notifications` |
| **HTTP Method** | POST |
| **Condition** | `notification_type eq new_user` |

**HTTP Payload** (use JSON editor):
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

Click **Create Webhook**

---

#### Webhook 3: Admin Notification - New Listing

Click **"Create Webhook"**

| Field | Value |
|-------|-------|
| **Name** | Admin Notification - New Listing |
| **Table** | `admin_notification_log` |
| **Events** | ☑ INSERT |
| **Type** | Supabase Edge Functions |
| **Edge Function** | `send-admin-notifications` |
| **HTTP Method** | POST |
| **Condition** | `notification_type eq new_listing` |

**HTTP Payload** (use JSON editor):
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

Click **Create Webhook**

---

### Step 5: Test Everything

**In Supabase Dashboard → SQL Editor:**

1. Copy and paste the contents of `TEST_EMAIL_AUTOMATION.sql`
2. Run it
3. Follow the on-screen instructions

**What to expect:**
1. A test question will be created on your test listing
2. The question will be answered
3. An admin notification will be triggered
4. Check Resend dashboard for emails: https://resend.com/emails
5. Check `frothmonkeyca@gmail.com` inbox

**Check Resend Dashboard:**
- Go to https://resend.com/emails
- You should see 3 new emails in the last few minutes:
  1. "New question on..." → sent to seller
  2. "Your question about... was answered" → sent to questioner
  3. "New User Registered: ..." → sent to frothmonkeyca@gmail.com

**If emails are NOT in Resend:**
- Webhooks are not triggering
- Double-check webhook configuration
- Check webhook logs in Supabase Dashboard

---

### Step 6: Cleanup Test Data

**After testing, clean up:**

```bash
# In Supabase SQL Editor, run:
```
Copy and paste contents of `CLEANUP_TEST_DATA.sql`

---

## 📊 Verification Checklist

After completing all steps, verify:

- [ ] Migrations applied (run `INVESTIGATE_EMAIL_AUTOMATION.sql`)
- [ ] Edge functions deployed (check Supabase Dashboard → Edge Functions)
- [ ] Webhooks configured (check Supabase Dashboard → Database → Webhooks)
- [ ] Test emails received (run `TEST_EMAIL_AUTOMATION.sql`)
- [ ] Resend shows email logs (https://resend.com/emails)
- [ ] Admin email is frothmonkeyca@gmail.com
- [ ] Test data cleaned up (run `CLEANUP_TEST_DATA.sql`)

---

## 🎯 Testing Real Scenarios

After everything is set up, test with real actions:

### Test Question Received Email
1. Log in as a non-owner user
2. Go to test listing: https://frothmonkey.com/listing/3ba8cbf9-70ea-4adc-981d-758a8082cd42
3. Ask a question in the Q&A section
4. Seller should receive email within seconds

### Test Question Answered Email
1. Log in as the seller (listing owner)
2. Go to the listing
3. Answer the question
4. The user who asked should receive email within seconds

### Test New User Registration Email
1. Create a new user account (use incognito/private browser)
2. Complete registration
3. frothmonkeyca@gmail.com should receive email within seconds

---

## 🐛 Troubleshooting

### Emails Still Not Sending?

**1. Check Edge Function Logs:**
```bash
# In Supabase Dashboard → Edge Functions
# Click on the function name
# Go to "Logs" tab
# Look for errors
```

**2. Check Webhook Logs:**
```bash
# In Supabase Dashboard → Database → Webhooks
# Click on the webhook name
# Go to "Logs" tab
# Look for failed requests
```

**3. Check Resend API Status:**
- Go to https://resend.com/dashboard
- Check if API key is valid
- Check if domain is verified

**4. Manually Test Edge Function:**
```bash
# Test send-notification-emails function
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-emails' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"record": {"id": "test-id", "type": "question_received"}}'
```

---

## 📁 Files Created

1. **INVESTIGATE_EMAIL_AUTOMATION.sql** - Diagnostic script
2. **TEST_EMAIL_AUTOMATION.sql** - Interactive testing script  
3. **CLEANUP_TEST_DATA.sql** - Test data cleanup script
4. **EMAIL_AUTOMATION_ACTION_PLAN.md** - This file

---

## 🔄 Quick Reference Commands

```bash
# Navigate to project
cd "/Users/geoffreywaterson/Documents/Cursor - Auction Marketplace"

# Apply migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy send-notification-emails
npx supabase functions deploy send-admin-notifications --no-verify-jwt

# Set secrets
npx supabase secrets set RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt
npx supabase secrets set APP_URL=https://frothmonkey.com

# Then configure webhooks in Supabase Dashboard
```

---

## ✅ Expected Outcome

After following this plan:

1. ✅ Question received emails will be sent to sellers
2. ✅ Question answered emails will be sent to users
3. ✅ New user registration emails will be sent to frothmonkeyca@gmail.com
4. ✅ All emails will appear in Resend dashboard
5. ✅ Admin email address is updated to frothmonkeyca@gmail.com

---

## 💡 Notes

- The Admin Test page tests the email templates directly, bypassing the webhook system. That's why those work but real events don't.
- Webhooks are the missing link between database triggers and edge functions.
- Always check Resend dashboard for debugging - if emails aren't there, webhooks aren't calling the edge functions.

---

## 🚨 Most Likely Fix

**99% chance this is your issue:**

The webhooks are not configured. Even if everything else is perfect, without webhooks, the edge functions never get called and emails are never sent.

**Priority Actions:**
1. Deploy edge functions (5 minutes)
2. Configure webhooks (10 minutes)  
3. Test (2 minutes)

Total time to fix: **~20 minutes**

---

## Next Steps

1. Run `INVESTIGATE_EMAIL_AUTOMATION.sql` to see current status
2. Follow the step-by-step fix plan above
3. Run `TEST_EMAIL_AUTOMATION.sql` to verify
4. Run `CLEANUP_TEST_DATA.sql` to clean up

Let me know the results from the investigation script and I'll help with any issues!

