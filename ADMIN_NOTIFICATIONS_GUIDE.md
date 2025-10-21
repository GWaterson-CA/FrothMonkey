# Admin Notifications System - Setup Guide

This guide will help you set up automated email notifications for FrothMonkey admin when:
1. **New users register** - Sends email with username, name, and email address
2. **New listings are created** - Sends email with listing details, link, photo, and username

All notifications are sent to: **frothmonkey@myyahoo.com**

---

## Overview

The admin notification system consists of:
- **Database triggers** that fire on new user/listing creation
- **Edge function** (`send-admin-notifications`) that sends emails via Resend
- **Logging table** (`admin_notification_log`) for tracking notifications

---

## Prerequisites

- Supabase project with Edge Functions enabled
- Resend account with API key configured
- Verified domain in Resend (frothmonkey.com)
- Supabase CLI installed (`npm install -g supabase`)

---

## Step 1: Deploy the Edge Function

The edge function handles sending admin notification emails.

```bash
# Deploy the edge function
supabase functions deploy send-admin-notifications --no-verify-jwt
```

This deploys the function that:
- Receives notification data (type + record)
- Formats beautiful HTML emails
- Sends via Resend to frothmonkey@myyahoo.com

---

## Step 2: Configure Edge Function Secrets

The edge function needs access to your Resend API key.

### Via Supabase Dashboard:

1. Go to: **Edge Functions** → **send-admin-notifications** → **Settings**
2. Add these secrets:
   - `RESEND_API_KEY`: Your Resend API key (starts with `re_`)
   - `APP_URL`: `https://frothmonkey.com` (or your deployment URL)

### Via CLI:

```bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Set app URL
supabase secrets set APP_URL=https://frothmonkey.com
```

---

## Step 3: Apply Database Migration

This creates the triggers and logging table.

```bash
# Apply the migration
supabase db push
```

Or manually run the migration:
```bash
psql $DATABASE_URL < supabase/migrations/044_admin_notifications_system.sql
```

This creates:
- `admin_notification_log` table - tracks all notification attempts
- `notify_admin_new_user()` function - triggered on profile INSERT
- `notify_admin_new_listing()` function - triggered on listing INSERT
- Triggers on `profiles` and `listings` tables

---

## Step 4: Set Up Database Webhooks

Database webhooks connect the triggers to the edge function.

### 4a. Create Webhook for New Users

1. Go to: [Supabase Dashboard → Database → Webhooks](https://supabase.com/dashboard)
2. Click **"Create Webhook"**
3. Configure:
   - **Name**: `Admin Notification - New User`
   - **Table**: `admin_notification_log`
   - **Events**: `INSERT` (checked)
   - **Type**: `Edge Function`
   - **Edge Function**: Select `send-admin-notifications`
   - **Conditions**: Add filter
     ```
     notification_type eq new_user
     ```

4. **HTTP Method**: `POST`

5. **Payload Template** (use the visual editor or JSON):
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

6. Click **Create Webhook**

### 4b. Create Webhook for New Listings

1. Go to: [Supabase Dashboard → Database → Webhooks](https://supabase.com/dashboard)
2. Click **"Create Webhook"**
3. Configure:
   - **Name**: `Admin Notification - New Listing`
   - **Table**: `admin_notification_log`
   - **Events**: `INSERT` (checked)
   - **Type**: `Edge Function`
   - **Edge Function**: Select `send-admin-notifications`
   - **Conditions**: Add filter
     ```
     notification_type eq new_listing
     ```

4. **HTTP Method**: `POST`

5. **Payload Template** (use the visual editor or JSON):
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

6. Click **Create Webhook**

---

## Step 5: Test the System

### Test New User Notification

1. Create a test user account on FrothMonkey
2. Complete the registration process
3. Check **frothmonkey@myyahoo.com** for the new user email
4. Verify the email contains:
   - ✅ Username
   - ✅ Full Name
   - ✅ Email Address
   - ✅ Registration Date

### Test New Listing Notification

1. Log in as any user
2. Create a new listing (can be draft status)
3. Check **frothmonkey@myyahoo.com** for the new listing email
4. Verify the email contains:
   - ✅ Listing Title
   - ✅ Description
   - ✅ Cover Image
   - ✅ Username of creator
   - ✅ Link to listing
   - ✅ Start Price, Reserve, Buy Now prices

---

## Troubleshooting

### Emails Not Being Received

1. **Check Edge Function Logs:**
   ```bash
   supabase functions logs send-admin-notifications
   ```
   Look for errors or confirmation messages.

2. **Check Webhook Status:**
   - Go to Database → Webhooks
   - View the webhook logs
   - Ensure webhooks are enabled and not failing

3. **Check Admin Notification Log:**
   ```sql
   SELECT * FROM admin_notification_log 
   ORDER BY sent_at DESC 
   LIMIT 10;
   ```
   This shows all recent notification attempts.

4. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - View recent email sends
   - Check for delivery failures

5. **Verify Edge Function Secrets:**
   ```bash
   supabase secrets list
   ```
   Ensure `RESEND_API_KEY` and `APP_URL` are set.

### Emails Going to Spam

1. **Verify Domain in Resend:**
   - Ensure frothmonkey.com is verified
   - Check SPF, DKIM, and DMARC records are set up

2. **Check Email Content:**
   - Test emails should not trigger spam filters
   - Resend has good deliverability

### Webhook Not Triggering

1. **Check Webhook Conditions:**
   - Ensure the condition matches exactly: `notification_type eq new_user` (or `new_listing`)
   - No extra spaces or typos

2. **Check Table Permissions:**
   - Ensure the webhook has permission to read from `admin_notification_log`

3. **Test Webhook Manually:**
   - Insert a test record:
   ```sql
   INSERT INTO admin_notification_log (notification_type, record_id, metadata)
   VALUES ('new_user', gen_random_uuid(), '{"username": "testuser", "full_name": "Test User", "created_at": "2025-10-21T12:00:00Z"}'::jsonb);
   ```
   - Check if email arrives

---

## Email Templates

### New User Email

**Subject:** 🎉 New User Registered: [username]

**Content:**
- Header with FrothMonkey logo
- "New User Registration" badge
- Info card with:
  - Username
  - Full Name
  - Email Address
  - Registration Date
- "View User in Admin Panel" button
- Footer

### New Listing Email

**Subject:** 📦 New Listing Created: [title]

**Content:**
- Header with FrothMonkey logo
- "New Listing" badge
- Listing preview with cover image
- Description
- Info card with:
  - Listed by (username)
  - Start Price
  - Reserve Price
  - Buy Now Price
  - Status
  - Created Date
- "View Listing" button
- Footer

---

## Monitoring and Analytics

### View Recent Admin Notifications

```sql
-- View last 20 notifications
SELECT 
    notification_type,
    sent_at,
    success,
    error_message,
    metadata->>'username' as username,
    metadata->>'title' as listing_title
FROM admin_notification_log
ORDER BY sent_at DESC
LIMIT 20;
```

### Count Notifications by Type

```sql
-- Count notifications by type (last 30 days)
SELECT 
    notification_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE success = true) as successful,
    COUNT(*) FILTER (WHERE success = false) as failed
FROM admin_notification_log
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY notification_type;
```

### Check Failed Notifications

```sql
-- View failed notifications
SELECT 
    notification_type,
    sent_at,
    error_message,
    metadata
FROM admin_notification_log
WHERE success = false
ORDER BY sent_at DESC;
```

---

## Customization

### Change Admin Email

Edit the edge function:
```typescript
// In supabase/functions/send-admin-notifications/index.ts
const ADMIN_EMAIL = 'your-new-email@example.com'
```

Then redeploy:
```bash
supabase functions deploy send-admin-notifications --no-verify-jwt
```

### Add More Notification Types

1. Add new trigger in migration:
   ```sql
   CREATE OR REPLACE FUNCTION notify_admin_new_event()
   RETURNS TRIGGER AS $$
   BEGIN
       INSERT INTO admin_notification_log (notification_type, record_id, metadata)
       VALUES ('new_event', NEW.id, to_jsonb(NEW));
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. Add trigger:
   ```sql
   CREATE TRIGGER trigger_notify_admin_new_event
       AFTER INSERT ON your_table
       FOR EACH ROW
       EXECUTE FUNCTION notify_admin_new_event();
   ```

3. Update edge function to handle new type
4. Create new webhook in Supabase dashboard

---

## Security Considerations

1. **Email Address**: The admin email is hardcoded in the edge function (not exposed in client)
2. **RLS Policies**: Only admins can view the `admin_notification_log` table
3. **Edge Function**: Uses service role key to access all data
4. **No Authentication**: Edge function doesn't require JWT (webhooks are internal)

---

## Maintenance

### Disable Notifications Temporarily

Disable the webhooks in Supabase Dashboard:
- Go to Database → Webhooks
- Toggle off the webhooks you want to disable

### Clean Up Old Logs

```sql
-- Delete logs older than 90 days
DELETE FROM admin_notification_log
WHERE sent_at < NOW() - INTERVAL '90 days';
```

Or set up a cron job to clean automatically:
```sql
-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_admin_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_notification_log
    WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (if available)
-- Or run manually periodically
```

---

## Support

For issues or questions:
- Check Resend docs: https://resend.com/docs
- Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Check Supabase Webhooks docs: https://supabase.com/docs/guides/database/webhooks
- Review this guide and troubleshooting section

---

## Summary Checklist

- [ ] Deploy edge function (`send-admin-notifications`)
- [ ] Set edge function secrets (`RESEND_API_KEY`, `APP_URL`)
- [ ] Apply database migration (044_admin_notifications_system.sql)
- [ ] Create webhook for new users
- [ ] Create webhook for new listings
- [ ] Test with new user registration
- [ ] Test with new listing creation
- [ ] Verify emails arrive at frothmonkey@myyahoo.com
- [ ] Monitor admin_notification_log for errors

---

## Quick Deploy Command

Run the deployment script:
```bash
./DEPLOY_ADMIN_NOTIFICATIONS.sh
```

This will:
1. Deploy the edge function
2. Apply the database migration
3. Show instructions for webhook setup

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0

