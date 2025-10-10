# Email Notifications Setup Guide

This guide will help you set up and configure the email notification system for FrothMonkey using Resend.

## Overview

The email notification system sends automated emails to users for the following events:

1. **Outbid Notification** - When a user is outbid on an auction
2. **Time Warning Notifications** - When an auction is ending soon (customizable: 1h, 2h, 3h, 6h, 12h, 24h, 48h)
3. **Auction Ended (Seller)** - When a seller's listing ends (with or without bids, reserve met or not)
4. **Auction Won (Buyer)** - When a buyer wins an auction

## Prerequisites

- Resend account with verified domain
- API key from Resend
- Supabase project with Edge Functions enabled

## Step 1: Set Environment Variables

Create or update your `.env.local` file in the root directory:

```bash
# Resend Email API Configuration
RESEND_API_KEY=re_9YeYT3LL_74CABnXyXYraSQThQvjya8Qt
NEXT_PUBLIC_SITE_URL=https://frothmonkey.com
```

**Note:** The `.env.local` file is gitignored and won't be committed to version control.

## Step 2: Apply Database Migration

Run the database migration to set up email notification functions:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply the migration directly in your Supabase dashboard
# Go to Database > Migrations and apply:
# supabase/migrations/029_email_notifications.sql
```

This migration:
- Updates the time warning notification function to support custom user timeframes
- Creates functions to notify sellers and buyers when auctions end
- Sets up triggers to create notifications automatically

## Step 3: Deploy Supabase Edge Function

Deploy the edge function that sends emails when notifications are created:

```bash
# Deploy the send-notification-emails function
supabase functions deploy send-notification-emails --project-ref YOUR_PROJECT_REF
```

## Step 4: Set Up Database Webhook

To trigger emails automatically when notifications are created:

1. Go to your Supabase Dashboard
2. Navigate to Database > Webhooks
3. Create a new webhook with these settings:
   - **Name:** Send Notification Emails
   - **Table:** notifications
   - **Events:** INSERT
   - **Type:** Edge Function
   - **Edge Function:** send-notification-emails

## Step 5: Configure Cron Job (Optional but Recommended)

Set up a cron job to send time warning notifications:

1. Go to your Supabase Dashboard
2. Navigate to Database > Cron Jobs
3. Create a new cron job:
   - **Name:** Send Time Warning Notifications
   - **Schedule:** `0 * * * *` (every hour at minute 0)
   - **SQL Command:** `SELECT schedule_time_notifications();`

This will check every hour if any auctions are approaching the user's preferred warning time.

## Step 6: Test the Email System

1. Go to the Admin panel: `/admin/email-test`
2. Enter your email address
3. Select a notification type to test
4. Click "Send Test Email"
5. Check your inbox for the test email

## Email Templates

The system includes beautiful, responsive email templates for all notification types:

- **Outbid Email** - Shows previous bid, new bid, and a button to place a higher bid
- **Time Warning Email** - Shows time remaining, current bid, and whether user is winning
- **Auction Ended (Seller)** - Shows final bid, buyer info, and reserve status
- **Auction Won (Buyer)** - Shows winning bid and seller info

All templates include:
- FrothMonkey branding and logo
- Responsive design for mobile and desktop
- Direct links to the relevant listing
- Footer with unsubscribe options

## User Notification Preferences

Users can customize their notification preferences at `/account/settings`:

- **Master Email Switch** - Enable/disable all email notifications
- **Individual Notification Types** - Toggle specific notification types
- **Time Warning Timeframe** - Choose when to be notified (1h to 48h before auction ends)

## Notification Types and When They're Sent

### 1. Outbid Notification (`bid_outbid`)
- **Trigger:** When a user who had the highest bid is outbid by another user
- **Sent Each Time:** Yes (users receive an email EVERY TIME they are outbid)
- **User Preference:** `bid_outbid`
- **Example Flow:**
  - User 1 bids $100
  - User 2 bids $150 → User 1 gets email ✅
  - User 1 bids $200 → User 2 gets email ✅
  - User 2 bids $250 → User 1 gets email ✅
  - And so on...

### 2. Time Warning Notifications (`time_warning_Xh`)
- **Trigger:** When an auction is X hours away from ending (based on user preference)
- **Sent Once:** Yes (per listing, per timeframe)
- **User Preference:** `time_warning_enabled` + `time_warning_hours`

### 3. Auction Ended - Seller (`listing_ended_seller`)
- **Trigger:** When a listing status changes to 'ended' or 'sold'
- **Sent To:** Listing owner (seller)
- **User Preference:** `listing_ended`

### 4. Auction Won (`auction_won`)
- **Trigger:** When a listing is sold (reserve met or Buy Now)
- **Sent To:** Highest bidder (winner)
- **User Preference:** `auction_won`

## Troubleshooting

### Emails Not Being Sent

1. **Check Environment Variables:**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY
   ```

2. **Check Database Webhook:**
   - Ensure the webhook is enabled
   - Check webhook logs in Supabase Dashboard

3. **Check Edge Function Logs:**
   ```bash
   supabase functions logs send-notification-emails --project-ref YOUR_PROJECT_REF
   ```

4. **Test Email Manually:**
   - Use the Admin Email Test page
   - Check the browser console for errors
   - Check the Network tab for API response errors

### Emails Going to Spam

1. **Verify Domain in Resend:**
   - Ensure updates@frothmonkey.com is verified
   - Set up SPF, DKIM, and DMARC records

2. **Check Email Content:**
   - Avoid spam trigger words
   - Ensure proper HTML formatting

### User Not Receiving Notifications

1. **Check User Preferences:**
   - Verify email_notifications is enabled
   - Verify specific notification type is enabled

2. **Check User Email:**
   - Ensure user has a valid email address in their account

## API Endpoints

### Send Notification Email
```
POST /api/email/send-notification
```
Body:
```json
{
  "userId": "user-uuid",
  "notificationType": "bid_outbid",
  "notificationData": {
    "listingId": "listing-uuid",
    "listingTitle": "Listing Title",
    "previousBid": 100,
    "newBid": 150
  }
}
```

### Send Test Email (Admin Only)
```
POST /api/email/send-test
```
Body:
```json
{
  "recipientEmail": "test@example.com",
  "recipientName": "Test User",
  "notificationType": "test_email",
  "notificationData": {
    "message": "Test message"
  }
}
```

## Monitoring and Analytics

### Email Delivery Status

Resend provides detailed delivery analytics:
1. Go to your Resend Dashboard
2. View email delivery status, open rates, and click rates
3. Check for bounces and complaints

### Notification Statistics

Check notification creation and delivery:
```sql
-- Count notifications by type (last 7 days)
SELECT type, COUNT(*) as count
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;

-- Check unread notifications
SELECT COUNT(*) as unread_count
FROM notifications
WHERE read_at IS NULL;
```

## Best Practices

1. **Monitor Email Deliverability:**
   - Keep bounce rates low
   - Monitor spam complaints
   - Regularly check Resend dashboard

2. **Respect User Preferences:**
   - Always check user preferences before sending
   - Provide easy unsubscribe options
   - Honor opt-out requests immediately

3. **Test Regularly:**
   - Test email templates after any changes
   - Verify emails render correctly on different devices
   - Check spam scores

4. **Performance:**
   - Edge functions handle email sending asynchronously
   - Notifications are created quickly without waiting for email delivery
   - Failed emails won't affect app performance

## Support

For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Review this implementation documentation

## Configuration Summary

| Setting | Value |
|---------|-------|
| Email Provider | Resend |
| SMTP Host | smtp.resend.com |
| SMTP Port | 587 |
| Sender Email | updates@frothmonkey.com |
| Sender Name | FrothMonkey |
| API Endpoint | /api/email/send-notification |
| Admin Test Page | /admin/email-test |

